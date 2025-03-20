const API_BASE_URL = 'https://farmweather-backend.onrender.com/api';

// Common headers for all requests
const getHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
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
            console.log(`Attempting to register: ${email}`);
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: getHeaders(false),
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Registration failed:', data);
                throw new Error(data.message || 'Registration failed');
            }
            
            console.log('Registration successful:', email);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            console.log(`Attempting to login: ${email}`);
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: getHeaders(false),
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Login failed:', data);
                throw new Error(data.message || 'Login failed');
            }
            
            console.log('Login successful:', email);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
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
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.message || 'Failed to get user profile');
            }
            
            return data;
        } catch (error) {
            console.error('Get profile error:', error);
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
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.message || 'Failed to add favorite city');
            }
            
            // Update local user data
            const user = this.getUser();
            if (user) {
                user.favoriteCities = data;
                localStorage.setItem('user', JSON.stringify(user));
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
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.message || 'Failed to remove favorite city');
            }
            
            // Update local user data
            const user = this.getUser();
            if (user) {
                user.favoriteCities = data;
                localStorage.setItem('user', JSON.stringify(user));
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