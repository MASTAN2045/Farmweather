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
const HOST = process.env.HOST || '0.0.0.0'; // Add host binding for Render

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
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4,
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
        startServer(); // Only start server after successful DB connection
    })
    .catch(err => {
        console.error('❌ MongoDB connection unsuccessful, retry after 5 seconds.', err);
        setTimeout(connectWithRetry, 5000);
    });
};

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://farmweather-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
    try {
        // Get query parameters
        const { city, country } = req.query;
        
        // Validate required parameters
        if (!city || !country) {
            return res.status(400).json({ 
                success: false,
                message: 'Both city and country parameters are required' 
            });
        }

        // Get API key from environment
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error('OpenWeatherMap API key is not configured');
            return res.status(500).json({ 
                success: false,
                message: 'Weather service configuration error' 
            });
        }

        console.log(`[${new Date().toISOString()}] Weather request for: ${city}, ${country}`);

        try {
            // Step 1: Get geocoding data
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&limit=1&appid=${apiKey}`;
            console.log('Geocoding URL:', geoUrl);
            
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                const errorText = await geoResponse.text();
                console.error('Geocoding API error:', errorText);
                return res.status(geoResponse.status).json({
                    success: false,
                    message: `Geocoding API error: ${errorText}`
                });
            }
            
            const geoData = await geoResponse.json();
            console.log('Geocoding response:', JSON.stringify(geoData));
            
            if (!geoData || geoData.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Location not found: ${city}, ${country}`
                });
            }
            
            // Extract coordinates
            const { lat, lon, name, country: countryCode } = geoData[0];
            console.log(`Found coordinates: ${lat}, ${lon} for ${name}, ${countryCode}`);
            
            // Step 2: Get current weather data
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            console.log('Weather URL:', weatherUrl);
            
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const errorText = await weatherResponse.text();
                console.error('Weather API error:', errorText);
                return res.status(weatherResponse.status).json({
                    success: false,
                    message: `Weather API error: ${errorText}`
                });
            }
            
            const weatherData = await weatherResponse.json();
            console.log('Weather response raw data:', JSON.stringify(weatherData).substring(0, 100) + '...');
            
            // Format and send response
            // Set cache control headers
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            // Format response data
            const response = {
                success: true,
                timestamp: new Date().toISOString(),
                location: {
                    name: weatherData.name,
                    country: weatherData.sys.country,
                    coordinates: {
                        lat: weatherData.coord.lat,
                        lon: weatherData.coord.lon
                    }
                },
                current: {
                    weather: {
                        main: weatherData.weather[0].main,
                        description: weatherData.weather[0].description,
                        icon: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`
                    },
                    temperature: {
                        current: Math.round(weatherData.main.temp),
                        feels_like: Math.round(weatherData.main.feels_like),
                        min: Math.round(weatherData.main.temp_min),
                        max: Math.round(weatherData.main.temp_max)
                    },
                    humidity: weatherData.main.humidity,
                    pressure: weatherData.main.pressure,
                    wind: {
                        speed: weatherData.wind.speed,
                        deg: weatherData.wind.deg,
                        direction: getWindDirection(weatherData.wind.deg)
                    },
                    clouds: weatherData.clouds.all,
                    visibility: weatherData.visibility / 1000, // Convert to km
                    sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
                    sunset: new Date(weatherData.sys.sunset * 1000).toISOString()
                }
            };
            
            // Log success
            console.log(`Weather data successfully retrieved for ${city}, ${country}`);
            
            // Send response
            return res.json(response);
            
        } catch (apiError) {
            console.error('OpenWeatherMap API error:', apiError);
            return res.status(500).json({
                success: false,
                message: 'Error communicating with weather service',
                error: apiError.message
            });
        }
    } catch (error) {
        console.error('Weather API error:', error);
        return res.status(500).json({ 
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

// Error handling middleware (move this before the 404 handler)
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// Handle unhandled routes (404 handler)
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

// Function to start the server
function startServer() {
    const server = app.listen(PORT, HOST, () => {
        console.log(`✅ Server is running on http://${HOST}:${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
        console.error('Server error:', error);
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
            process.exit(1);
        }
    });

    // Handle process termination
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM. Performing graceful shutdown...');
        server.close(() => {
            console.log('Server closed. Disconnecting from MongoDB...');
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed. Process terminating...');
                process.exit(0);
            });
        });
    });
}

// Initial connection
connectWithRetry(); 