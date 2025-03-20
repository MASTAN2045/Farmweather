from http.server import BaseHTTPRequestHandler
import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

def get_weather(city, country):
    try:
        params = {
            'q': f"{city},{country}",
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(BASE_URL, params=params)
        data = response.json()
        
        if response.status_code == 200:
            weather_data = {
                'temperature': round(data['main']['temp']),
                'humidity': data['main']['humidity'],
                'description': data['weather'][0]['description'],
                'wind_speed': data['wind']['speed'],
                'city': data['name'],
                'country': data['sys']['country']
            }
            return weather_data
        else:
            return {"error": "Failed to fetch weather data"}, response.status_code
            
    except Exception as e:
        return {"error": str(e)}, 500

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from urllib.parse import parse_qs, urlparse
            query_components = parse_qs(urlparse(self.path).query)
            
            city = query_components.get('city', [None])[0]
            country = query_components.get('country', [None])[0]
            
            if not city or not country:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "City and country are required"}).encode())
                return
                
            result = get_weather(city, country)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode()) 