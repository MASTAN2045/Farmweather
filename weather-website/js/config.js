// Get your API key from: https://openweathermap.org/api
const CONFIG = {
    apiKey: '7bf5bda8cea708aeaf80996d648920a2',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    backendUrl: 'http://localhost:4000'
};

// Make CONFIG globally accessible
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
} 