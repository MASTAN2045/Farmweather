const config = {
    // Backend settings
    MONGODB_URI: 'mongodb+srv://weather-app:weather123@cluster0.mongodb.net/weather_app?retryWrites=true&w=majority',
    PORT: 5000,
    
    // Frontend settings
    WEATHER_API: {
        KEY: '7bf5bda8cea708aeaf80996d648920a2', // Replace with your OpenWeatherMap API key
        URL: 'https://api.openweathermap.org/data/2.5'
    }
};

module.exports = config; 