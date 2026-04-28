"""
Train a RandomForest model for Netflix churn prediction and save artifacts.

Expect a CSV at `training/data/netflix_data.csv` with a target column named `churned` (1/0 or Yes/No).
This script builds a preprocessing pipeline using OneHotEncoder for categoricals,
SMOTE for balancing, and RandomForestClassifier. Saves `model.pkl` and `encoder.pkl` in `backend/`.
"""
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline


# Prefer dataset placed under backend/data/ if present (user provided)
DEFAULT_DATA = Path(__file__).parent / "data" / "netflix_data.csv"
BACKEND_DATA = Path(__file__).parent.parent / "backend" / "data" / "netflix_user_behavior_dataset.csv"
DATA_PATH = BACKEND_DATA if BACKEND_DATA.exists() else DEFAULT_DATA
MODEL_OUT = Path(__file__).parent.parent / "backend" / "model.pkl"
ENCODER_OUT = Path(__file__).parent.parent / "backend" / "encoder.pkl"


def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}. Place your CSV there.")
    df = pd.read_csv(path)
    return df


def build_pipeline(df: pd.DataFrame, target_col: str = "churned"):
    if target_col not in df.columns:
        raise KeyError(f"Target column '{target_col}' not found in data")

    # Drop ID-like columns if present
    drop_cols = [c for c in df.columns if c.lower() in ("user_id", "id")]
    X = df.drop(columns=[target_col] + drop_cols)
    y = df[target_col].copy()

    # Normalize boolean-like / string targets to 0/1
    if y.dtype == object:
        y = y.map({"Yes": 1, "No": 0}).fillna(y)

    # Feature typing
    categorical_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    # Column transformer: OneHot for categoricals, StandardScaler for numerics
    # Handle scikit-learn API differences for sparse output parameter
    try:
        # scikit-learn >=1.2 uses sparse_output
        ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        ohe = OneHotEncoder(handle_unknown="ignore", sparse=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", ohe, categorical_cols),
            ("num", StandardScaler(), numerical_cols),
        ],
        remainder="drop",
    )

    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)

    pipeline = ImbPipeline(steps=[
        ("preprocessor", preprocessor),
        ("smote", SMOTE(random_state=42)),
        ("classifier", clf),
    ])

    return pipeline, categorical_cols, numerical_cols


def train_and_save():
    df = load_data(DATA_PATH)
    pipeline, cat_cols, num_cols = build_pipeline(df)

    target = "churned"
    X = df.drop(columns=[target])
    y = df[target]
    if y.dtype == object:
        y = y.map({"Yes": 1, "No": 0}).fillna(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training pipeline (this may take a little while)...")
    pipeline.fit(X_train, y_train)

    # Save pipeline (includes preprocessor+smote+classifier) and also save preprocessor separately
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT)
    joblib.dump(pipeline.named_steps["preprocessor"], ENCODER_OUT)

    print(f"Saved model to {MODEL_OUT}")
    print(f"Saved encoder to {ENCODER_OUT}")


if __name__ == "__main__":
    train_and_save()
