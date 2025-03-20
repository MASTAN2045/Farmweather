require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: ['https://farmweather-frontend.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "http://api.openweathermap.org/data/2.5/weather";

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: "healthy", message: "FarmWeather API is running" });
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
    try {
        const { city, country } = req.query;
        
        if (!city || !country) {
            return res.status(400).json({ error: "City and country are required" });
        }

        if (!OPENWEATHER_API_KEY) {
            console.error('OpenWeatherMap API key is not configured');
            return res.status(500).json({ error: "Weather service is not properly configured" });
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
                error: "Failed to fetch weather data",
                details: data.message || 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: "Internal server error",
        message: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`OpenWeatherMap API key configured: ${!!OPENWEATHER_API_KEY}`);
}); 