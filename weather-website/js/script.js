// Check authentication status
function checkAuth() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Update UI with user info
async function updateUserUI() {
    try {
        const user = AuthService.getUser();
        if (user) {
            // Add user info to the page if you have a user section
            const userSection = document.querySelector('.user-info');
            if (userSection) {
                userSection.innerHTML = `
                    <span>Welcome, ${user.username}</span>
                    <button onclick="handleLogout()">Logout</button>
                `;
            }

            // Load favorite cities
            const userData = await AuthService.getUserProfile();
            if (userData.favoriteCities && userData.favoriteCities.length > 0) {
                // Update UI with favorite cities if you have a favorites section
                const favoritesSection = document.querySelector('.favorite-cities');
                if (favoritesSection) {
                    favoritesSection.innerHTML = userData.favoriteCities
                        .map(city => `
                            <div class="favorite-city" onclick="searchWeather('${city.cityName}', '${city.countryCode}')">
                                ${city.cityName}, ${city.countryCode}
                            </div>
                        `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error updating user UI:', error);
    }
}

// Handle logout
function handleLogout() {
    AuthService.logout();
}

// Add city to favorites
async function addToFavorites(cityName, countryCode) {
    try {
        await AuthService.addFavoriteCity(cityName, countryCode);
        updateUserUI(); // Refresh the favorites list
        alert('City added to favorites!');
    } catch (error) {
        alert(error.message || 'Failed to add city to favorites');
    }
}

// Remove city from favorites
async function removeFromFavorites(cityName, countryCode) {
    try {
        await AuthService.removeFavoriteCity(cityName, countryCode);
        updateUserUI(); // Refresh the favorites list
        alert('City removed from favorites!');
    } catch (error) {
        alert(error.message || 'Failed to remove city from favorites');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        updateUserUI();
    }
});

// ... rest of your existing weather-related code ... 