const mongoose = require('mongoose');

const weatherSearchSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    userContext: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: String
    },
    searchType: {
        type: String,
        enum: ['weather', 'chat'],
        default: 'chat'
    }
});

module.exports = mongoose.model('WeatherSearch', weatherSearchSchema); 