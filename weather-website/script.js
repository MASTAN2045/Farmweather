document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const countrySelect = document.getElementById('countrySelect');
    const stateSelect = document.getElementById('stateSelect');
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.querySelector('.search-bar button');
    const temperatureElement = document.getElementById('temperature');
    const humidityElement = document.getElementById('humidity');
    const rainfallElement = document.getElementById('rainfall');
    const soilMoistureElement = document.getElementById('soil-moisture');

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

    // Sample agricultural weather data
    const mockWeatherData = {
        temperature: 28,
        humidity: 65,
        rainfall: 2.5,
        soilMoisture: 45,
        windSpeed: 12,
        uvIndex: 6,
        cropRecommendations: {
            'Rice': 'Optimal conditions for rice cultivation. Consider irrigation in the next 2 days.',
            'Wheat': 'Monitor soil moisture levels. Expected rainfall may affect harvest timing.',
            'Cotton': 'High humidity levels detected. Watch for potential pest issues.'
        }
    };

    // Navigation scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(46, 125, 50, 0.95)';
        } else {
            nav.style.background = 'rgba(46, 125, 50, 0.9)';
        }
    });

    // Handle country selection
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
    });

    function updateWeatherDisplay(data) {
        // Add animation class
        const weatherItems = document.querySelectorAll('.weather-item');
        weatherItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
        });

        // Update values with animation
        setTimeout(() => {
            temperatureElement.textContent = `${data.temperature}°C`;
            humidityElement.textContent = `${data.humidity}%`;
            rainfallElement.textContent = `${data.rainfall} mm`;
            soilMoistureElement.textContent = `${data.soilMoisture}%`;

            // Add crop recommendations if container exists
            const cropRecsContainer = document.getElementById('crop-recommendations');
            if (cropRecsContainer) {
                cropRecsContainer.innerHTML = '';
                Object.entries(data.cropRecommendations).forEach(([crop, recommendation]) => {
                    const recElement = document.createElement('div');
                    recElement.className = 'crop-recommendation';
                    recElement.innerHTML = `
                        <h4>${crop}</h4>
                        <p>${recommendation}</p>
                    `;
                    cropRecsContainer.appendChild(recElement);
                });
            }

            weatherItems.forEach(item => {
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
        }, 200);
    }

    function handleSearch() {
        const country = countrySelect.value;
        const state = stateSelect.value;
        const city = cityInput.value.trim();

        if (!country || !state || !city) {
            alert('Please select country, state and enter city');
            return;
        }

        // Show loading state
        const weatherItems = document.querySelectorAll('.weather-item p');
        weatherItems.forEach(item => {
            item.textContent = 'Loading...';
        });

        // Simulate API call delay
        setTimeout(() => {
            // In a real application, you would make an API call here
            // For demonstration, we'll add some randomization to mock data
            const randomizedData = {
                ...mockWeatherData,
                temperature: mockWeatherData.temperature + (Math.random() * 4 - 2),
                humidity: mockWeatherData.humidity + (Math.random() * 10 - 5),
                rainfall: Math.max(0, mockWeatherData.rainfall + (Math.random() * 1 - 0.5)),
                soilMoisture: Math.max(0, mockWeatherData.soilMoisture + (Math.random() * 10 - 5))
            };
            updateWeatherDisplay(randomizedData);
        }, 1000);
    }

    // Event Listeners
    searchButton.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Initialize with mock data
    updateWeatherDisplay(mockWeatherData);

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