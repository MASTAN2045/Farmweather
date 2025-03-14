document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentTempElement = document.getElementById('currentTemp');
    const currentHumidityElement = document.getElementById('currentHumidity');
    const currentWindElement = document.getElementById('currentWind');
    const cropAdviceList = document.getElementById('cropAdviceList');
    const irrigationAdviceList = document.getElementById('irrigationAdviceList');
    const weatherPrecautionsList = document.getElementById('weatherPrecautionsList');
    const forecastContainer = document.getElementById('forecastContainer');
    const locationDisplay = document.getElementById('location-display');
    const weatherConditionDisplay = document.getElementById('weather-condition-display');

    // Weather API configuration - use the global CONFIG object
    const WEATHER_CONFIG = window.CONFIG || {
        apiKey: '7bf5bda8cea708aeaf80996d648920a2',
        apiUrl: 'https://api.openweathermap.org/data/2.5'
    };

    console.log('Advisory page loaded');
    console.log('CONFIG:', WEATHER_CONFIG);

    // Function to get query parameters
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city') || '',
            state: params.get('state') || ''
        };
    }

    // Weather data fetching and processing
    async function getWeatherData(city, state, country) {
        try {
            console.log(`Fetching weather data for ${city}, ${state}, ${country}`);
            const weatherResponse = await fetch(`${WEATHER_CONFIG.apiUrl}/weather?q=${city},${state},${country}&appid=${WEATHER_CONFIG.apiKey}&units=metric`);
            
            if (!weatherResponse.ok) {
                throw new Error('Weather data not found');
            }

            return await weatherResponse.json();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    async function getForecastData(city, state, country) {
        try {
            console.log(`Fetching forecast data for ${city}, ${state}, ${country}`);
            const forecastResponse = await fetch(`${WEATHER_CONFIG.apiUrl}/forecast?q=${city},${state},${country}&appid=${WEATHER_CONFIG.apiKey}&units=metric`);
            
            if (!forecastResponse.ok) {
                throw new Error('Forecast data not found');
            }

            return await forecastResponse.json();
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            return null;
        }
    }

    function displayWeatherData(data) {
        console.log('Displaying weather data:', data);
        
        // Update location display
        locationDisplay.textContent = `${data.name}, ${getQueryParams().state}`;
        
        // Update temperature
        currentTempElement.textContent = `${Math.round(data.main.temp)}°C`;
        
        // Update weather condition display with icon
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        weatherConditionDisplay.innerHTML = `
            <img src="${iconUrl}" alt="${data.weather[0].description}" style="width: 50px; height: 50px;">
            <span>${data.weather[0].description}</span>
        `;
        
        // Update humidity and wind
        currentHumidityElement.textContent = `${data.main.humidity}%`;
        currentWindElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    }

    function displayForecast(data) {
        console.log('Displaying forecast data');
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        
        forecastContainer.innerHTML = dailyForecasts.map(day => {
            const temp = Math.round(day.main.temp);
            const tempClass = temp > 30 ? 'temp-hot' : temp < 10 ? 'temp-cold' : 'temp-normal';
            const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
            
            return `
                <div class="forecast-item">
                    <div class="forecast-date">${new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="forecast-weather">
                        <img src="${iconUrl}" alt="${day.weather[0].description}" style="width: 40px; height: 40px;">
                        ${day.weather[0].main}
                    </div>
                    <div class="forecast-temp ${tempClass}">${temp}°C</div>
                    <div class="forecast-details">
                        <span><i class="fa-solid fa-droplet"></i> ${day.main.humidity}%</span>
                        <span><i class="fa-solid fa-wind"></i> ${Math.round(day.wind.speed * 3.6)} km/h</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function generateFarmingAdvice(weather, forecast) {
        console.log('Generating farming advice');
        const temp = weather.main.temp;
        const humidity = weather.main.humidity;
        const windSpeed = weather.wind.speed;
        const weatherDescription = weather.weather[0].description.toLowerCase();
        const { state } = getQueryParams();

        // Clear previous advice
        cropAdviceList.innerHTML = '';
        irrigationAdviceList.innerHTML = '';
        weatherPrecautionsList.innerHTML = '';

        // Generate advice based on weather conditions
        if (temp > 35) {
            cropAdviceList.innerHTML += '<li class="high-risk">Heat stress risk - Protect sensitive crops</li>';
            cropAdviceList.innerHTML += '<li class="moderate-risk">Apply mulching to reduce soil temperature</li>';
        } else if (temp < 10) {
            cropAdviceList.innerHTML += '<li class="high-risk">Cold stress risk for tropical crops</li>';
            cropAdviceList.innerHTML += '<li class="moderate-risk">Protect nurseries with polyhouse covering</li>';
        } else {
            cropAdviceList.innerHTML += '<li class="optimal">Current temperature is suitable for most crops</li>';
        }

        if (humidity > 85) {
            irrigationAdviceList.innerHTML += '<li class="high-risk">High humidity - Monitor for fungal diseases</li>';
            irrigationAdviceList.innerHTML += '<li class="moderate-risk">Reduce irrigation frequency</li>';
        } else if (humidity < 40) {
            irrigationAdviceList.innerHTML += '<li class="high-risk">Low humidity alert - Increase irrigation frequency</li>';
            irrigationAdviceList.innerHTML += '<li class="moderate-risk">Consider drip irrigation for water conservation</li>';
        } else {
            irrigationAdviceList.innerHTML += '<li class="optimal">Maintain regular irrigation schedule</li>';
        }

        if (windSpeed > 15) {
            weatherPrecautionsList.innerHTML += '<li class="high-risk">Strong winds - Secure farm structures</li>';
            weatherPrecautionsList.innerHTML += '<li class="moderate-risk">Delay spraying operations</li>';
        } else if (weatherDescription.includes('rain')) {
            weatherPrecautionsList.innerHTML += '<li class="moderate-risk">Rain expected - Ensure proper drainage</li>';
            weatherPrecautionsList.innerHTML += '<li class="low-risk">Delay fertilizer application</li>';
        } else {
            weatherPrecautionsList.innerHTML += '<li class="optimal">No immediate weather concerns</li>';
        }
    }

    // Fetch weather data based on URL parameters
    async function fetchWeatherDataFromParams() {
        const { city, state } = getQueryParams();
        console.log('URL Parameters:', { city, state });
        
        if (city && state) {
            try {
                const weatherData = await getWeatherData(city, state, 'IN');
                if (weatherData) {
                    displayWeatherData(weatherData);
                    document.title = `Farming Advisory - ${weatherData.name}, ${state}`;
                    
                    const forecastData = await getForecastData(city, state, 'IN');
                    if (forecastData) {
                        displayForecast(forecastData);
                        generateFarmingAdvice(weatherData, forecastData);
                    }
                }
            } catch (error) {
                console.error('Error fetching weather data:', error);
                locationDisplay.textContent = 'Error loading weather data';
                weatherConditionDisplay.innerHTML = 'Please try again later';
            }
        } else {
            console.log('No city or state parameters found in URL');
            locationDisplay.textContent = 'No location selected';
            weatherConditionDisplay.innerHTML = 'Please select a location from the weather page';
            
            // Redirect to weather page after 3 seconds if no parameters
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    }

    // Call the function to fetch data on page load
    fetchWeatherDataFromParams();

    // Set up an interval to fetch weather data every 5 minutes
    const updateInterval = setInterval(fetchWeatherDataFromParams, 5 * 60 * 1000);

    // Clear interval when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(updateInterval);
        } else {
            fetchWeatherDataFromParams();
            setInterval(fetchWeatherDataFromParams, 5 * 60 * 1000);
        }
    });
}); 