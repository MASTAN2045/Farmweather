// Load environment variables based on NODE_ENV
require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Set mongoose options
mongoose.set('strictQuery', false);

// MongoDB Connection with retries
const connectWithRetry = () => {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        process.exit(1);
    }

    console.log('MongoDB connection with retry');
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds
        family: 4, // Use IPv4, skip trying IPv6
        ssl: true,
        sslValidate: true,
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 5
    })
    .then(() => {
        console.log('✅ MongoDB is connected');
        console.log('Environment:', process.env.NODE_ENV);
    })
    .catch(err => {
        console.error('❌ MongoDB connection unsuccessful, retry after 5 seconds.', err);
        setTimeout(connectWithRetry, 5000);
    });
};

// Initial connection
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected, trying to reconnect...');
    setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://farmweather-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
    try {
        const { city, country } = req.query;
        
        if (!city || !country) {
            return res.status(400).json({ 
                success: false,
                message: 'Both city and country parameters are required' 
            });
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error('OpenWeatherMap API key is not configured');
            return res.status(500).json({ 
                success: false,
                message: 'Weather service configuration error' 
            });
        }

        console.log(`Fetching weather data for ${city}, ${country}`);

        // Get coordinates first for more accurate results
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&limit=1&appid=${apiKey}`;
        
        const geoResponse = await fetch(geoUrl, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!geoResponse.ok) {
            console.error('Geocoding API error:', await geoResponse.text());
            return res.status(geoResponse.status).json({
                success: false,
                message: 'Error finding location coordinates'
            });
        }

        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Location not found: ${city}, ${country}`
            });
        }

        const { lat, lon } = geoData[0];
        console.log(`Found coordinates for ${city}, ${country}: lat=${lat}, lon=${lon}`);

        // Get detailed weather data using coordinates
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
        const weatherResponse = await fetch(weatherUrl, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!weatherResponse.ok) {
            console.error('Weather API error:', await weatherResponse.text());
            return res.status(weatherResponse.status).json({
                success: false,
                message: 'Error fetching weather data'
            });
        }

        const data = await weatherResponse.json();

        // Set cache control headers to prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const weatherData = {
            success: true,
            location: {
                city: data.name,
                country: data.sys.country,
                coordinates: { lat, lon }
            },
            weather: {
                main: data.weather[0].main,
                description: data.weather[0].description,
                icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
                temperature: {
                    current: Math.round(data.main.temp),
                    feels_like: Math.round(data.main.feels_like),
                    min: Math.round(data.main.temp_min),
                    max: Math.round(data.main.temp_max)
                },
                humidity: data.main.humidity,
                wind: {
                    speed: data.wind.speed,
                    deg: data.wind.deg,
                    direction: getWindDirection(data.wind.deg)
                },
                pressure: data.main.pressure,
                clouds: data.clouds.all,
                visibility: data.visibility,
                sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
                sunset: new Date(data.sys.sunset * 1000).toISOString()
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(`Successfully fetched weather data for ${city}, ${country}`);
        res.json(weatherData);
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error while fetching weather data',
            error: error.message 
        });
    }
});

// Helper function to convert wind degrees to cardinal directions
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
    return directions[index];
}

// Root route with API documentation
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to FarmWeather API',
        endpoints: {
            weather: '/api/weather?city={city}&country={country}',
            health: '/api/health',
            users: {
                register: '/api/users/register',
                login: '/api/users/login',
                profile: '/api/users',
                favorites: '/api/users/favorites'
            }
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        mongoConnection: mongoose.connection.readyState === 1
    };
    res.json(healthcheck);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error', 
        error: err.message 
    });
});

// Handle unhandled routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        availableEndpoints: {
            weather: '/api/weather?city={city}&country={country}',
            health: '/api/health',
            docs: '/'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
}); 