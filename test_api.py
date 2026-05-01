import requests
import json

data = {
    "age": 30,
    "gender": "Male",
    "country": "USA",
    "account_age_months": 12,
    "subscription_type": "Standard",
    "monthly_fee": 12.99,
    "payment_method": "PayPal",
    "primary_device": "Laptop",
    "devices_used": 2,
    "favorite_genre": "Comedy",
    "avg_watch_time_minutes": 120,
    "watch_sessions_per_week": 6,
    "binge_watch_sessions": 2,
    "completion_rate": 72,
    "rating_given": 3.5,
    "content_interactions": 10,
    "recommendation_click_rate": 20,
    "days_since_last_login": 4,
    "threshold": 0.5,
}

try:
    response = requests.post("http://localhost:8000/predict", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
