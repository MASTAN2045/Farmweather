// Replace this with your Render backend URL after deployment
const API_BASE_URL = 'https://farmweather-backend.onrender.com/api';

// Common headers for all requests
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
            const response = await fetch(
                `${API_BASE_URL}/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch weather data');
            }
            return data;
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    },

    async getForecast(city, country) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`,
                {
                    method: 'GET',
                    headers: getHeaders(),
                }
            );
            const data = await response.json();
            if (!response.ok) {
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
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Backend service is not healthy');
            }
            return data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}; 