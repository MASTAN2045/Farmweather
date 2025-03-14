document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const stateInput = document.getElementById('stateInput');
    const countryInput = document.getElementById('countryInput');
    const searchBtn = document.getElementById('searchBtn');
    const cityElement = document.getElementById('city');
    const tempElement = document.getElementById('temp');
    const conditionElement = document.getElementById('condition');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('wind-speed');
    const forecastContainer = document.getElementById('forecast-container');

    // Backend API URL
    const BACKEND_URL = window.CONFIG.backendUrl;
    
    // Weather API configuration
    const WEATHER_CONFIG = window.CONFIG || {
        apiKey: '7bf5bda8cea708aeaf80996d648920a2',
        apiUrl: 'https://api.openweathermap.org/data/2.5'
    };

    // Indian States
    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh',
        'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
        'Ladakh', 'Lakshadweep', 'Puducherry'
    ];

    // Create suggestion containers
    function createSuggestionContainer(input) {
        const container = document.createElement('div');
        container.className = 'suggestions';
        container.style.display = 'none';
        input.parentNode.insertBefore(container, input.nextSibling);
        return container;
    }

    // Create suggestion containers for each input
    const stateSuggestions = createSuggestionContainer(stateInput);
    const citySuggestions = createSuggestionContainer(cityInput);

    // Function to show suggestions
    function showSuggestions(input, suggestions, data) {
        const value = input.value.toLowerCase();
        if (!value) {
            suggestions.style.display = 'none';
            return;
        }

        const matches = data
            .filter(item => item.toLowerCase().includes(value))
            .slice(0, 5);

        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(match => 
                `<div class="suggestion-item">${match}</div>`
            ).join('');
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    }

    // Add input event listener for state
    stateInput.addEventListener('input', () => {
        showSuggestions(stateInput, stateSuggestions, indianStates);
    });

    // Function to handle suggestion click
    function handleSuggestionClick(input, suggestions, event) {
        if (event.target.classList.contains('suggestion-item')) {
            input.value = event.target.textContent;
            suggestions.style.display = 'none';
            
            if (input === stateInput) {
                cityInput.value = '';
                cityInput.focus();
            }
        }
    }

    // Add click event listener for state suggestions
    stateSuggestions.addEventListener('click', (e) => handleSuggestionClick(stateInput, stateSuggestions, e));

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('.search-inputs input')) {
            stateSuggestions.style.display = 'none';
            citySuggestions.style.display = 'none';
        }
    });

    // Function to save weather search to MongoDB
    async function saveWeatherSearch(weatherData, state) {
        try {
            const searchData = {
                city: weatherData.name,
                state: state || '',
                country: weatherData.sys.country,
                temperature: weatherData.main.temp,
                condition: weatherData.weather[0].description,
                humidity: weatherData.main.humidity,
                windSpeed: weatherData.wind.speed
            };

            const response = await fetch(`${BACKEND_URL}/api/weather-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData)
            });

            if (!response.ok) throw new Error('Failed to save search history');
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Function to fetch weather data
    async function getWeatherData(city, state, country) {
        try {
            let query = city;
            if (state) query += `,${state}`;
            if (country) query += `,${country}`;

            const response = await fetch(`${WEATHER_CONFIG.apiUrl}/weather?q=${query}&units=metric&appid=${WEATHER_CONFIG.apiKey}`);
            if (!response.ok) throw new Error('Location not found');
            const data = await response.json();
            await saveWeatherSearch(data, state);
            return data;
        } catch (error) {
            alert(error.message);
            return null;
        }
    }

    // Function to fetch 5-day forecast
    async function getForecastData(city, state, country) {
        try {
            let query = city;
            if (state) query += `,${state}`;
            if (country) query += `,${country}`;

            const response = await fetch(`${WEATHER_CONFIG.apiUrl}/forecast?q=${query}&units=metric&appid=${WEATHER_CONFIG.apiKey}`);
            if (!response.ok) throw new Error('Forecast data not available');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Function to update weather UI
    function updateWeatherUI(data) {
        if (!data) return;
        
        const location = [data.name];
        if (stateInput.value) location.push(stateInput.value);
        if (data.sys.country) location.push(data.sys.country);
        
        cityElement.textContent = `Weather in ${location.join(', ')}`;
        tempElement.textContent = Math.round(data.main.temp);
        conditionElement.textContent = data.weather[0].description;
        humidityElement.textContent = `${data.main.humidity}%`;
        windSpeedElement.textContent = `${data.wind.speed} km/h`;
    }

    // Function to update forecast UI
    function updateForecastUI(data) {
        if (!data) return;

        forecastContainer.innerHTML = '';
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));

        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div>${day}</div>
                <div>${Math.round(forecast.main.temp)}°C</div>
                <div>${forecast.weather[0].description}</div>
            `;
            forecastContainer.appendChild(forecastItem);
        });
    }

    // Event listener for search button
    searchBtn.addEventListener('click', async () => {
        const city = cityInput.value.trim();
        const state = stateInput.value.trim();
        const country = 'IN';  // Always use India

        if (!city) {
            alert('Please enter a city name');
            return;
        }

        if (!state) {
            alert('Please enter a state');
            return;
        }

        const weatherData = await getWeatherData(city, state, country);
        if (weatherData) {
            updateWeatherUI(weatherData);
            const forecastData = await getForecastData(city, state, country);
            updateForecastUI(forecastData);
            displaySearchHistory();

            // Show advisory button
            const advisoryBtn = document.getElementById('advisoryBtn');
            advisoryBtn.style.display = 'inline-block';
            advisoryBtn.onclick = () => {
                window.location.href = `farmer-advisory.html?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
            };
        }
    });

    // Event listener for Enter key on any input
    [cityInput, stateInput, countryInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    });

    // Function to fetch and display search history
    async function displaySearchHistory() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/weather-history`);
            const history = await response.json();
            
            // Create history container if it doesn't exist
            let historyContainer = document.getElementById('search-history');
            if (!historyContainer) {
                historyContainer = document.createElement('div');
                historyContainer.id = 'search-history';
                historyContainer.className = 'search-history';
                document.querySelector('.container').appendChild(historyContainer);
            }

            // Create header with clear button
            const headerHtml = `
                <div class="history-header">
                    <h3>Recent Searches (Last 5)</h3>
                    ${history.length > 0 ? `
                        <button id="clearHistory" class="clear-btn" title="Clear search history">
                            <i class="fa-solid fa-trash"></i> Clear History
                        </button>
                    ` : ''}
                </div>
                <div id="history-items"></div>
            `;
            
            // Set the header HTML
            historyContainer.innerHTML = headerHtml;
            
            // Get the history items container
            const historyItemsContainer = document.getElementById('history-items');
            
            // Add history items (limited to 5)
            if (history.length > 0) {
                history.slice(0, 5).forEach(item => {
                    const location = [item.city];
                    if (item.state) location.push(item.state);
                    if (item.country) location.push(item.country);

                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="history-city">${location.join(', ')}</div>
                        <div class="history-temp">${Math.round(item.temperature)}°C</div>
                        <div class="history-date">${new Date(item.searchDate).toLocaleDateString()}</div>
                    `;
                    historyItem.addEventListener('click', () => {
                        cityInput.value = item.city;
                        stateInput.value = item.state || '';
                        countryInput.value = item.country || '';
                        searchBtn.click();
                    });
                    historyItemsContainer.appendChild(historyItem);
                });

                // Add clear button functionality
                const clearBtn = document.getElementById('clearHistory');
                if (clearBtn) {
                    clearBtn.addEventListener('click', async () => {
                        if (confirm('Are you sure you want to clear all search history?')) {
                            try {
                                const response = await fetch(`${BACKEND_URL}/api/weather-history`, {
                                    method: 'DELETE'
                                });
                                if (response.ok) {
                                    historyContainer.innerHTML = `
                                        <div class="history-header">
                                            <h3>Recent Searches (Last 5)</h3>
                                        </div>
                                        <div id="history-items">
                                            <p style="text-align: center; color: #666;">No search history</p>
                                        </div>
                                    `;
                                }
                            } catch (error) {
                                console.error('Error clearing history:', error);
                                alert('Failed to clear search history. Please try again.');
                            }
                        }
                    });
                }
            } else {
                historyItemsContainer.innerHTML = '<p style="text-align: center; color: #666;">No search history</p>';
            }
        } catch (error) {
            console.error('Error fetching search history:', error);
        }
    }

    // Get user's location weather on page load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(
                    `${WEATHER_CONFIG.apiUrl}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_CONFIG.apiKey}`
                );
                const data = await response.json();
                updateWeatherUI(data);
                await saveWeatherSearch(data);
                
                const forecastResponse = await fetch(
                    `${WEATHER_CONFIG.apiUrl}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_CONFIG.apiKey}`
                );
                const forecastData = await forecastResponse.json();
                updateForecastUI(forecastData);
                
                // Display initial search history
                displaySearchHistory();
            } catch (error) {
                console.error('Error fetching location weather:', error);
            }
        });
    }

    // Function to get query parameters
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city') || '',
            state: params.get('state') || ''
        };
    }

    // Fetch weather data based on URL parameters
    async function fetchWeatherDataFromParams() {
        const { city, state } = getQueryParams();
        if (city && state) {
            const weatherData = await getWeatherData(city, state, 'IN');
            if (weatherData) {
                displayWeatherData(weatherData);
                const forecastData = await getForecastData(city, state, 'IN');
                displayForecast(forecastData);
                generateFarmingAdvice(weatherData, forecastData);
            }
        }
    }

    // Call the function to fetch data on page load
    fetchWeatherDataFromParams();

    function generateFarmingAdvice(weather, forecast) {
        const temp = weather.main.temp;
        const humidity = weather.main.humidity;
        const windSpeed = weather.wind.speed;
        const weatherDescription = weather.weather[0].description.toLowerCase();

        // Clear previous advice
        cropAdviceList.innerHTML = '';
        irrigationAdviceList.innerHTML = '';
        weatherPrecautionsList.innerHTML = '';

        // Generate advice based on weather conditions
        if (temp > 35) {
            cropAdviceList.innerHTML += '<li>Heat stress risk - Protect sensitive crops</li>';
        }
        if (humidity > 85) {
            irrigationAdviceList.innerHTML += '<li>High humidity - Monitor for fungal diseases</li>';
        }
        if (windSpeed > 15) {
            weatherPrecautionsList.innerHTML += '<li>Strong winds - Secure farm structures</li>';
        }
    }
}); 