import axios from "axios";

const API_KEY = "7bf5bda8cea708aeaf80996d648920a2"; // Replace with your API key

const fetchWeatherAndAdvice = async () => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
    );

    const weatherData = response.data;
    const temp = weatherData.main.temp;
    const weatherCondition = weatherData.weather[0].main.toLowerCase();

    setWeather(weatherCondition);
    
    // Generate advisory based on weather
    let adviceMessage = "No specific advice at the moment.";
    if (weatherCondition.includes("rain")) {
      adviceMessage = "Rain expected. Avoid over-irrigation and protect crops.";
    } else if (weatherCondition.includes("clear")) {
      adviceMessage = "Sunny weather. Optimal for harvesting and drying crops.";
    } else if (weatherCondition.includes("cloud")) {
      adviceMessage = "Cloudy weather. Monitor humidity for fungal risks.";
    }

    setAdvice(adviceMessage);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    setAdvice("Could not retrieve weather data. Try again later.");
  }
};

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

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements for weather display
    const currentTempElement = document.getElementById('currentTemp');
    const currentHumidityElement = document.getElementById('currentHumidity');
    const currentWindElement = document.getElementById('currentWind');

    // Function to get query parameters
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city') || '',
            state: params.get('state') || ''
        };
    }

    // Function to display weather data
    function displayWeatherData(weatherData) {
        // Update current weather conditions
        currentTempElement.textContent = `${Math.round(weatherData.main.temp)}°C`;
        currentHumidityElement.textContent = `${weatherData.main.humidity}%`;
        currentWindElement.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    }

    // Fetch weather data based on URL parameters
    async function fetchWeatherDataFromParams() {
        const { city, state } = getQueryParams();
        if (city && state) {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/weather?q=${city},${state},IN&appid=${CONFIG.apiKey}&units=metric`);
                if (!response.ok) {
                    throw new Error('Weather data not found');
                }
                const weatherData = await response.json();
                displayWeatherData(weatherData);
                
                // Fetch and display forecast data
                const forecastResponse = await fetch(`${CONFIG.apiUrl}/forecast?q=${city},${state},IN&appid=${CONFIG.apiKey}&units=metric`);
                if (!forecastResponse.ok) {
                    throw new Error('Forecast data not found');
                }
                const forecastData = await forecastResponse.json();
                displayForecast(forecastData);
                generateFarmingAdvice(weatherData, forecastData);
            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        }
    }

    // Call the function to fetch data on page load
    fetchWeatherDataFromParams();

    // Set up an interval to fetch weather data every 5 minutes
    setInterval(fetchWeatherDataFromParams, 5 * 60 * 1000);
});
