document.addEventListener('DOMContentLoaded', () => {
    const viewAdviceBtn = document.getElementById('viewAdviceBtn');
    const cropAdviceContainer = document.getElementById('cropAdvice');
    const cropAdviceContent = document.getElementById('cropAdviceContent');

    // Crop advice database
    const cropAdvice = {
        wheat: {
            icon: 'fa-wheat-awn',
            optimal: {
                temperature: '15-24°C',
                humidity: '50-70%',
                rainfall: '450-650mm'
            },
            tips: [
                'Plant in well-drained soil with good water retention',
                'Apply nitrogen-rich fertilizers during growth phase',
                'Monitor for rust and powdery mildew',
                'Ensure proper spacing between plants'
            ]
        },
        rice: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '20-35°C',
                humidity: '70-85%',
                rainfall: '1000-2000mm'
            },
            tips: [
                'Maintain proper water level in paddy fields',
                'Control weeds during initial growth stages',
                'Monitor for blast disease and stem borers',
                'Apply balanced fertilizers'
            ]
        },
        corn: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '20-30°C',
                humidity: '50-80%',
                rainfall: '500-800mm'
            },
            tips: [
                'Ensure adequate sunlight exposure',
                'Apply organic matter before planting',
                'Monitor for corn borers and leaf blight',
                'Maintain proper irrigation during tasseling'
            ]
        },
        lentils: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '18-30°C',
                humidity: '40-70%',
                rainfall: '350-500mm'
            },
            tips: [
                'Plant in well-drained soil',
                'Avoid over-irrigation',
                'Monitor for root rot and wilt',
                'Apply rhizobium inoculation'
            ]
        },
        chickpeas: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '20-25°C',
                humidity: '40-60%',
                rainfall: '600-1000mm'
            },
            tips: [
                'Plant in deep, well-drained soil',
                'Avoid waterlogging',
                'Monitor for pod borers',
                'Apply phosphorus-rich fertilizers'
            ]
        },
        soybeans: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '20-30°C',
                humidity: '60-70%',
                rainfall: '600-1000mm'
            },
            tips: [
                'Ensure proper soil pH (6.0-6.8)',
                'Apply organic matter before planting',
                'Monitor for rust and defoliating insects',
                'Maintain proper row spacing'
            ]
        },
        tomatoes: {
            icon: 'fa-apple-whole',
            optimal: {
                temperature: '20-27°C',
                humidity: '50-70%',
                rainfall: '400-600mm'
            },
            tips: [
                'Provide support for climbing',
                'Prune suckers regularly',
                'Monitor for blight and leaf spot',
                'Maintain consistent watering'
            ]
        },
        potatoes: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '15-25°C',
                humidity: '60-70%',
                rainfall: '500-700mm'
            },
            tips: [
                'Plant in loose, well-drained soil',
                'Hill soil around plants',
                'Monitor for late blight',
                'Avoid overwatering'
            ]
        },
        onions: {
            icon: 'fa-seedling',
            optimal: {
                temperature: '13-24°C',
                humidity: '50-70%',
                rainfall: '350-550mm'
            },
            tips: [
                'Plant in fertile, well-drained soil',
                'Maintain proper spacing',
                'Monitor for purple blotch',
                'Stop watering when tops begin to fall'
            ]
        }
    };

    // Function to generate advice for selected crops
    function generateCropAdvice() {
        const selectedCrops = Array.from(document.querySelectorAll('.crop-checkbox:checked'))
            .map(checkbox => checkbox.id);

        if (selectedCrops.length === 0) {
            alert('Please select at least one crop');
            return;
        }

        cropAdviceContent.innerHTML = selectedCrops.map(cropName => {
            const crop = cropAdvice[cropName];
            return `
                <div class="crop-advice-item">
                    <h4><i class="fa-solid ${crop.icon}"></i> ${cropName.charAt(0).toUpperCase() + cropName.slice(1)}</h4>
                    <div class="optimal-conditions">
                        <p><strong>Optimal Growing Conditions:</strong></p>
                        <ul>
                            <li>Temperature: ${crop.optimal.temperature}</li>
                            <li>Humidity: ${crop.optimal.humidity}</li>
                            <li>Annual Rainfall: ${crop.optimal.rainfall}</li>
                        </ul>
                    </div>
                    <div class="growing-tips">
                        <p><strong>Growing Tips:</strong></p>
                        <ul>
                            ${crop.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');

        cropAdviceContainer.style.display = 'block';
    }

    // Event listener for the view advice button
    viewAdviceBtn.addEventListener('click', generateCropAdvice);

    // Event listener for checkboxes to enable/disable button
    document.querySelectorAll('.crop-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const anyChecked = Array.from(document.querySelectorAll('.crop-checkbox'))
                .some(cb => cb.checked);
            viewAdviceBtn.disabled = !anyChecked;
        });
    });
}); 