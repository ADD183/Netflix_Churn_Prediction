from typing import List, Any, Dict
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent / "model.pkl"


def load_model(path: Path = MODEL_PATH):
    if not path.exists():
        raise FileNotFoundError(f"Model not found at {path}")
    return joblib.load(path)


def df_from_input(d: Dict[str, Any]) -> pd.DataFrame:
    return pd.DataFrame([d])
