require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WeatherSearch = require('./models/WeatherSearch');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Attempt reconnection
        setTimeout(() => {
            console.log('Attempting to reconnect to MongoDB...');
            mongoose.connect(process.env.MONGODB_URI, mongoOptions);
        }, 5000);
    });

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    }, 5000);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

// Routes
app.post('/api/weather-history', async (req, res) => {
    try {
        const weatherSearch = new WeatherSearch(req.body);
        await weatherSearch.save();
        res.status(201).json(weatherSearch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/weather-history', async (req, res) => {
    try {
        const history = await WeatherSearch.find()
            .sort({ searchDate: -1 })
            .limit(5);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/weather-history', async (req, res) => {
    try {
        await WeatherSearch.deleteMany({});
        res.status(200).json({ message: 'Search history cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 