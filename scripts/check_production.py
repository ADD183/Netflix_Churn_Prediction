import json
import urllib.request


BASE = "http://127.0.0.1:8003"


def fetch_text(path: str) -> str:
    return urllib.request.urlopen(BASE + path).read().decode("utf-8", "ignore")


root = fetch_text("/")
print("has-root-app", '<div id="root"></div>' in root)
print("health", fetch_text("/health"))

payload = {
    "age": 56,
    "gender": "Male",
    "country": "India",
    "account_age_months": 17,
    "subscription_type": "Standard",
    "monthly_fee": 15.99,
    "payment_method": "PayPal",
    "primary_device": "Laptop",
    "devices_used": 1,
    "favorite_genre": "Sci-Fi",
    "avg_watch_time_minutes": 220,
    "watch_sessions_per_week": 17,
    "binge_watch_sessions": 3,
    "completion_rate": 60,
    "rating_given": 1.7,
    "content_interactions": 5,
    "recommendation_click_rate": 66,
    "days_since_last_login": 16,
    "threshold": 0.5,
}

request = urllib.request.Request(
    BASE + "/predict",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
)
print("predict", urllib.request.urlopen(request).read().decode())
