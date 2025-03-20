document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const countrySelect = document.getElementById('countrySelect');
    const stateSelect = document.getElementById('stateSelect');
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.querySelector('.search-button');
    const locationEl = document.getElementById('locationText');
    const temperatureElement = document.getElementById('temperature');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('windSpeed');
    const rainfallElement = document.getElementById('rainfall');

    // Country and State data
    const statesByCountry = {
        'IN': [
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
            if (stateSelect) {
                stateSelect.innerHTML = '<option value="">Select State</option>';
                stateSelect.disabled = !country;

                const states = statesByCountry[country];
                if (country && states) {
                    states.forEach(state => {
                        const option = document.createElement('option');
                        option.value = state;
                        option.textContent = state;
                        stateSelect.appendChild(option);
                    });
                }
            }
            
            // Clear weather when country changes
            clearWeatherDisplay();
        });
    }

    // Handle search button click
    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const country = countrySelect ? countrySelect.value : '';
            const state = stateSelect ? stateSelect.value : '';
            const city = cityInput ? cityInput.value.trim() : '';
            
            if (!country || !city) {
                alert('Please select a country and enter a city name');
                return;
            }

            try {
                // Show loading state
                clearWeatherDisplay();
                locationEl.textContent = 'Loading...';
                
                // Fetch real-time weather data
                const weatherData = await weatherService.getCurrentWeather(city, country);
                
                if (weatherData && weatherData.success) {
                    // Update location display
                    locationEl.textContent = `Location: ${city}, ${state}, ${country}`;
                    
                    // Update weather display with real data
                    updateWeatherDisplay(weatherData);
                } else {
                    throw new Error('Failed to fetch weather data');
                }
            } catch (error) {
                console.error('Error fetching weather:', error);
                alert('Failed to fetch weather data. Please try again.');
                clearWeatherDisplay();
            }
        });
    }

    // Update weather display with data
    function updateWeatherDisplay(data) {
        if (!data || !data.current) {
            console.error('Invalid weather data:', data);
            return;
        }

        try {
            // Update temperature
            if (temperatureElement && data.current.temperature) {
                const temp = data.current.temperature.current;
                temperatureElement.textContent = `${Math.round(temp)}°C`;
            }
            
            // Update humidity
            if (humidityElement && data.current.humidity) {
                const humidity = data.current.humidity;
                humidityElement.textContent = `${Math.round(humidity)}%`;
            }
            
            // Update wind speed
            if (windSpeedElement && data.current.wind) {
                const wind = data.current.wind.speed;
                windSpeedElement.textContent = `${Math.round(wind)} km/h`;
            }
            
            // Update rainfall if available
            if (rainfallElement && data.current.rain) {
                const rain = data.current.rain['1h'] || 0; // Get last hour rainfall
                rainfallElement.textContent = `${rain} mm`;
            } else if (rainfallElement) {
                rainfallElement.textContent = '0 mm';
            }

            // Add weather description if available
            if (data.current.weather && data.current.weather.description) {
                console.log('Weather description:', data.current.weather.description);
            }
        } catch (error) {
            console.error('Error updating weather display:', error);
            clearWeatherDisplay();
            alert('Error displaying weather data');
        }
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