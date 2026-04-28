# Netflix Churn Predictor

This project provides a production-ready web app (FastAPI + simple frontend) to predict Netflix churn using a trained RandomForest model.

Project layout

netflix-churn-app/
- backend/
- frontend/
- training/
- requirements.txt

Quickstart

1. Install dependencies (prefer virtualenv):

```bash
pip install -r requirements.txt
```

2. Prepare training CSV

Place your dataset as `training/data/netflix_data.csv`. The dataset must contain a target column named `churned` with values `1/0` or `Yes/No`.

3. Train and save model

```bash
python training/train_model.py
```

This will write `backend/model.pkl` and `backend/encoder.pkl`.

4. Run the backend server

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

5. Run the React frontend in development

```bash
cd frontend
npm install
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173/`.

If you want the backend to serve the frontend in production, build the app first:

```bash
cd frontend
npm run build
```

Then visit `http://localhost:8000/` or your chosen Uvicorn port.

Notes

- The training script uses OneHotEncoder (handle_unknown='ignore') to avoid LabelEncoder mapping issues.
- The pipeline uses SMOTE to balance classes and RandomForest as classifier.
- The backend exposes `/predict` and `/health`. Swagger UI is available at `/docs`.
- The frontend is now a React + Vite app with a richer dashboard UI and feature-importance chart.
