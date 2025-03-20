// Replace this with your Render backend URL after deployment
const API_BASE_URL = 'https://farmweather-backend.onrender.com/api';

// Common headers for all requests
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const weatherService = {
    async getCurrentWeather(city, country) {
        try {
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            console.log(`Fetching weather for ${city}, ${country} at ${new Date().toISOString()}`);
            
            const response = await fetch(
                `${API_BASE_URL}/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&_=${timestamp}`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                }
            );
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Weather fetch error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch weather data');
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (!data || !data.success || !data.current) {
                console.error('Invalid weather data structure:', data);
                throw new Error('Received invalid weather data format');
            }
            
            console.log(`Weather data received for ${city}, ${country}:`, 
                data.current.temperature.current + '°C, ' +
                data.current.humidity + '% humidity, ' +
                data.current.weather.description
            );
            
            return data;
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    },

    async getForecast(city, country) {
        try {
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            
            const response = await fetch(
                `${API_BASE_URL}/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&_=${timestamp}`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                }
            );
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Forecast fetch error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch forecast data');
            }
            
            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_BASE_URL}/health?_=${timestamp}`, {
                method: 'GET',
                headers: getHeaders(),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Health check failed:', errorData);
                throw new Error(errorData.message || 'Backend service is not healthy');
            }
            
            const data = await response.json();
            console.log('Health check successful:', data);
            
            return data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}; 