const API_BASE_URL = 'https://farmweather-backend.onrender.com/api';

// Common headers for all requests
const getHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

class AuthService {
    static async register(username, email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: getHeaders(false),
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            
            if (!response.ok) {
                const error = new Error(data.message || 'Registration failed');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: getHeaders(false),
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (!response.ok) {
                const error = new Error(data.message || 'Login failed');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async getUserProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || 'Failed to get user profile');
            }
            
            return data;
        } catch (error) {
            console.error('Profile error:', error);
            throw error;
        }
    }

    static async addFavoriteCity(cityName, countryCode) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/users/favorites`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ cityName, countryCode })
            });
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || 'Failed to add favorite city');
            }
            
            return data;
        } catch (error) {
            console.error('Add favorite error:', error);
            throw error;
        }
    }

    static async removeFavoriteCity(cityName, countryCode) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/users/favorites`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ cityName, countryCode })
            });
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || 'Failed to remove favorite city');
            }
            
            return data;
        } catch (error) {
            console.error('Remove favorite error:', error);
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    static isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    static getUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.logout();
            return null;
        }
    }
} 