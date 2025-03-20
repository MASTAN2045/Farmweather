from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# OpenWeatherMap API configuration
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

@app.route('/api/weather', methods=['GET'])
def get_weather():
    try:
        city = request.args.get('city')
        country = request.args.get('country')
        
        if not city or not country:
            return jsonify({"error": "City and country are required"}), 400
            
        # Construct the API URL
        params = {
            'q': f"{city},{country}",
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric'
        }
        
        # Make the API request
        response = requests.get(BASE_URL, params=params)
        data = response.json()
        
        if response.status_code == 200:
            # Extract relevant weather data
            weather_data = {
                'temperature': round(data['main']['temp']),
                'humidity': data['main']['humidity'],
                'description': data['weather'][0]['description'],
                'wind_speed': data['wind']['speed'],
                'city': data['name'],
                'country': data['sys']['country']
            }
            return jsonify(weather_data)
        else:
            return jsonify({"error": "Failed to fetch weather data"}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 