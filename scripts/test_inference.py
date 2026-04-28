import joblib
import pandas as pd
from pathlib import Path

model_path = Path('backend/model.pkl')
print('Model exists:', model_path.exists())
model = joblib.load(model_path)
# build sample from first CSV row
df = pd.read_csv('backend/data/netflix_user_behavior_dataset.csv')
sample = df.drop(columns=['user_id','churned']).iloc[0:1]
print('Sample input:')
print(sample.to_dict(orient='records')[0])
prob = model.predict_proba(sample)[0][1]
print('Predicted probability:', prob)
print('Predicted label:', 'Yes' if prob>=0.5 else 'No')
