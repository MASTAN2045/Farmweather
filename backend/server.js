require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // 5 second timeout
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if cannot connect to database
});

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// CORS configuration
const corsOptions = {
    origin: ['https://farmweather-frontend.vercel.app', 'http://localhost:3000'],
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

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "http://api.openweathermap.org/data/2.5/weather";

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

// Weather endpoint
app.get('/api/weather', async (req, res) => {
    try {
        const { city, country } = req.query;
        
        if (!city || !country) {
            return res.status(400).json({ 
                message: 'City and country are required parameters' 
            });
        }

        if (!OPENWEATHER_API_KEY) {
            return res.status(500).json({ 
                message: 'Weather API key not configured' 
            });
        }
        
        // Construct the API URL
        const params = new URLSearchParams({
            q: `${city},${country}`,
            appid: OPENWEATHER_API_KEY,
            units: 'metric'
        });
        
        console.log(`Fetching weather for ${city}, ${country}`);
        
        // Make the API request
        const response = await fetch(`${BASE_URL}?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            // Extract relevant weather data
            const weatherData = {
                temperature: Math.round(data.main.temp),
                humidity: data.main.humidity,
                description: data.weather[0].description,
                wind_speed: data.wind.speed,
                city: data.name,
                country: data.sys.country
            };
            console.log('Weather data fetched successfully');
            res.json(weatherData);
        } else {
            console.error('OpenWeatherMap API error:', data);
            res.status(response.status).json({
                message: data.message || 'Error fetching weather data'
            });
        }
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({ 
            message: 'Error fetching weather data', 
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        message: 'Internal server error', 
        error: err.message 
    });
});

// Handle unhandled routes
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`OpenWeatherMap API key configured: ${!!OPENWEATHER_API_KEY}`);
}); 