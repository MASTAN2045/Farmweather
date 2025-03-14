const mongoose = require('mongoose');

const weatherSearchSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    temperature: {
        type: Number,
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    windSpeed: {
        type: Number,
        required: true
    },
    searchDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WeatherSearch', weatherSearchSchema); 