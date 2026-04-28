from pathlib import Path
import os
import joblib
import pandas as pd
import numpy as np

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any


APP_DIR = Path(__file__).parent
MODEL_PATH = APP_DIR / "model.pkl"
ENCODER_PATH = APP_DIR / "encoder.pkl"

app = FastAPI(title="Netflix Churn Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist"
if FRONTEND_DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")), name="frontend-assets")
elif FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend-static")


class UserInput(BaseModel):
    age: int = Field(..., ge=10, le=120)
    gender: str
    country: str
    account_age_months: int = Field(..., ge=0)
    subscription_type: str
    monthly_fee: float = Field(..., ge=0)
    payment_method: str
    primary_device: str
    devices_used: int = Field(..., ge=1)
    favorite_genre: str
    avg_watch_time_minutes: float = Field(..., ge=0)
    watch_sessions_per_week: int = Field(..., ge=0)
    binge_watch_sessions: int = Field(..., ge=0)
    completion_rate: float = Field(..., ge=0)
    rating_given: float = Field(..., ge=0)
    content_interactions: int = Field(..., ge=0)
    recommendation_click_rate: float = Field(..., ge=0)
    days_since_last_login: int = Field(..., ge=0)


class PredictionRequest(UserInput):
    threshold: Optional[float] = Field(0.5, ge=0.0, le=1.0)


model = None
preprocessor = None
classifier = None


def load_artifacts():
    global model, preprocessor, classifier
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run the training script first.")
    model = joblib.load(MODEL_PATH)
    # model is expected to be an imblearn Pipeline with named_steps
    try:
        preprocessor = model.named_steps.get("preprocessor")
        classifier = model.named_steps.get("classifier")
    except Exception:
        preprocessor = None
        classifier = None


@app.on_event("startup")
def startup_event():
    try:
        load_artifacts()
    except Exception as e:
        # Don't crash the server; endpoints will return helpful message
        print(f"Warning: could not load model on startup: {e}")


@app.get("/")
def serve_frontend():
    index_path = FRONTEND_DIST_DIR / "index.html" if FRONTEND_DIST_DIR.exists() else FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path)


def get_feature_names(preprocessor) -> List[str]:
    if preprocessor is None:
        return []
    try:
        names = preprocessor.get_feature_names_out()
        return names.tolist()
    except Exception:
        # Best-effort fallback
        return []


def pretty_feature_name(raw_name: str) -> str:
    name = raw_name.split("__")[-1]
    return name.replace("_", " ").strip().title()


def explain_reason(top_features: List[str], user_values: Dict[str, Any], prediction: str) -> str:
    # Simple heuristic explanation using top features and user values
    reasons = []
    for feat in top_features:
        key = feat.split("__")[-1]
        if key in user_values:
            val = user_values[key]
            if key == "days_since_last_login" and isinstance(val, (int, float)) and val > 14:
                reasons.append("infrequent logins")
            if key == "avg_watch_time_minutes" and isinstance(val, (int, float)) and val < 90:
                reasons.append("low watch time")
            if key == "watch_sessions_per_week" and isinstance(val, (int, float)) and val < 4:
                reasons.append("few weekly sessions")
            if key == "completion_rate" and isinstance(val, (int, float)) and val < 60:
                reasons.append("low completion rate")
            if key == "devices_used" and isinstance(val, (int, float)) and val == 1:
                reasons.append("limited device usage")
    if reasons:
        lead = "higher risk of churn" if prediction == "Yes" else "lower churn risk"
        return f"The model sees {lead} mainly because of " + ", ".join(sorted(set(reasons))) + "."
    return "The model prediction is driven by the strongest signals in the user behavior profile."


@app.get("/health")
def health():
    ok = MODEL_PATH.exists()
    return {"status": "ok" if ok else "model_missing", "model_path": str(MODEL_PATH)}


@app.post("/predict")
def predict(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Run training script to generate model.pkl")

    # Build dataframe
    data = pd.DataFrame([req.dict(exclude={"threshold"})])

    try:
        prob = float(model.predict_proba(data)[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    threshold = req.threshold if req.threshold is not None else 0.5
    prediction = "Yes" if prob >= threshold else "No"

    # Feature importance
    feature_importances = []
    top_features = []
    if classifier is not None:
        try:
            feat_names = get_feature_names(preprocessor)
            importances = classifier.feature_importances_
            if len(feat_names) == len(importances):
                pairs = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)
            else:
                pairs = sorted(list(enumerate(importances)), key=lambda x: x[1], reverse=True)
            feature_importances = [{"feature": str(k), "importance": float(v)} for k, v in pairs[:10]]
            top_features = [f["feature"] for f in feature_importances[:3]]
        except Exception:
            feature_importances = []

    explanation = explain_reason(top_features, data.iloc[0].to_dict(), prediction)

    return {
        "churn_probability": prob,
        "churn_prediction": prediction,
        "threshold": threshold,
        "top_features": top_features,
        "top_feature_labels": [pretty_feature_name(name) for name in top_features],
        "feature_importances": feature_importances,
        "explanation": explanation,
    }
