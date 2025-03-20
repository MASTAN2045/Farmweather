document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const countrySelect = document.getElementById('countrySelect');
    const stateSelect = document.getElementById('stateSelect');
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.querySelector('.search-button');
    const locationEl = document.querySelector('.weather-header h2');
    const temperatureElement = document.querySelector('#temperature');
    const humidityElement = document.querySelector('#humidity');
    const windSpeedElement = document.querySelector('#windSpeed');
    const rainfallElement = document.querySelector('#rainfall');

    // Country and State data
    const statesByCountry = {
        'India': [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
            'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
        ],
        'US': [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
            'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
            'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
            'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
            'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
            'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
            'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
            'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
            'West Virginia', 'Wisconsin', 'Wyoming'
        ],
        'UK': [
            'England', 'Scotland', 'Wales', 'Northern Ireland'
        ],
        'AU': [
            'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
            'South Australia', 'Tasmania', 'Australian Capital Territory',
            'Northern Territory'
        ]
    };

    // Initialize empty values
    function clearWeatherDisplay() {
        if (locationEl) locationEl.textContent = 'Location: --';
        if (temperatureElement) temperatureElement.textContent = '--°C';
        if (humidityElement) humidityElement.textContent = '--%';
        if (windSpeedElement) windSpeedElement.textContent = '-- km/h';
        if (rainfallElement) rainfallElement.textContent = '-- mm';
    }

    // Import API services
    let weatherService;
    import('./js/api.js')
        .then(module => {
            weatherService = module.weatherService;
            console.log('Weather service loaded');
        })
        .catch(error => {
            console.error('Error loading API module:', error);
        });

    // Handle country selection
    if (countrySelect) {
        countrySelect.addEventListener('change', () => {
            const country = countrySelect.value;
            stateSelect.innerHTML = '<option value="">Select State</option>';
            stateSelect.disabled = !country;

            if (country && statesByCountry[country]) {
                statesByCountry[country].forEach(state => {
                    const option = document.createElement('option');
                    option.value = state;
                    option.textContent = state;
                    stateSelect.appendChild(option);
                });
            }
            
            // Clear weather when country changes
            clearWeatherDisplay();
        });
    }

    // Clear weather display when state changes
    if (stateSelect) {
        stateSelect.addEventListener('change', () => {
            clearWeatherDisplay();
        });
    }

    // Clear weather display when city changes
    if (cityInput) {
        cityInput.addEventListener('input', () => {
            clearWeatherDisplay();
        });
    }

    async function updateWeatherDisplay(data) {
        try {
            // Add animation class
            const weatherItems = document.querySelectorAll('.weather-item');
            weatherItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
            });

            // Extract data from API response
            const temperature = data.current.temperature.current;
            const humidity = data.current.humidity;
            const windSpeed = data.current.wind.speed;
            const locationName = `${data.location.name}, ${data.location.country}`;
            
            // Update location display
            if (locationEl) {
                locationEl.textContent = `Location: ${locationName}`;
            }

            // Update values with animation
            setTimeout(() => {
                if (temperatureElement) temperatureElement.textContent = `${temperature}°C`;
                if (humidityElement) humidityElement.textContent = `${humidity}%`;
                if (windSpeedElement) windSpeedElement.textContent = `${windSpeed} km/h`;
                if (rainfallElement) rainfallElement.textContent = `0 mm`; // OpenWeather doesn't provide rainfall directly

                weatherItems.forEach(item => {
                    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                });
            }, 200);
        } catch (error) {
            console.error('Error updating weather display:', error);
            alert('Error displaying weather data. Please try again.');
        }
    }

    async function handleSearch() {
        const country = countrySelect ? countrySelect.value : '';
        const state = stateSelect ? stateSelect.value : '';
        const city = cityInput ? cityInput.value.trim() : '';

        if (!country || !state || !city) {
            alert('Please select country, state and enter city');
            return;
        }

        // Show loading state
        if (locationEl) locationEl.textContent = 'Loading...';
        const weatherItems = document.querySelectorAll('.weather-item p');
        weatherItems.forEach(item => {
            item.textContent = 'Loading...';
        });

        try {
            // Use weather service API
            if (!weatherService) {
                throw new Error('Weather service not loaded');
            }
            
            console.log(`Fetching weather for ${city}, ${country}`);
            const weatherData = await weatherService.getCurrentWeather(city, country);
            
            if (!weatherData || !weatherData.success) {
                throw new Error('Failed to fetch weather data');
            }
            
            console.log('Received weather data:', weatherData);
            updateWeatherDisplay(weatherData);
        } catch (error) {
            console.error('Error fetching weather:', error);
            alert('Error fetching weather data. Please try again later.');
            clearWeatherDisplay();
        }
    }

    // Event Listeners
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Initialize with empty values
    clearWeatherDisplay();

    // Navigation scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(46, 125, 50, 0.95)';
        } else {
            nav.style.background = 'rgba(46, 125, 50, 0.9)';
        }
    });

    // Add animation for feature cards on scroll
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}); 