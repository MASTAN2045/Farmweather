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
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Weather fetch error:', data);
                throw new Error(data.message || 'Failed to fetch weather data');
            }
            
            console.log(`Weather data received for ${city}, ${country}:`, data.success);
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
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Forecast fetch error:', data);
                throw new Error(data.message || 'Failed to fetch forecast data');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health?_=${Date.now()}`, {
                method: 'GET',
                headers: getHeaders(),
            });
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Health check failed:', data);
                throw new Error(data.message || 'Backend service is not healthy');
            }
            
            return data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}; 