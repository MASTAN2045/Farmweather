const API_BASE_URL = '/api';

export const weatherService = {
    async getCurrentWeather(city, country) {
        try {
            const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    },

    async getForecast(city, country) {
        try {
            const response = await fetch(`${API_BASE_URL}/forecast?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (!response.ok) {
                throw new Error('Backend service is not healthy');
            }
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}; 