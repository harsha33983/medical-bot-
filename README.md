# AI Medical Symptom Prediction Chatbot

## Project Overview
This is a full-stack healthcare chatbot that predicts possible medical conditions based on user-provided symptoms. It utilizes machine learning models (Decision Tree & SVC) trained on medical datasets to provide predictions, descriptions, recommended precautions, and symptom severity. The chatbot features both text and voice interaction (via Web Speech API and pyttsx3).

## Architecture
- **Frontend**: React, Vite, React Router, CSS
- **Backend**: FastAPI, SQLite (SQLAlchemy), JWT Authentication
- **Machine Learning**: Scikit-learn (Decision Tree, Support Vector Classifier), Pandas, NumPy

## Dataset Explanation
- `dataset.csv`: Main dataset mapping multiple symptoms to a specific disease.
- `list_of_symptoms.pickle`: A list of all unique symptoms in the dataset.
- `symptom_Description.csv`: Descriptions of the diseases.
- `symptom_precaution.csv`: Recommended precautions for the diseases.
- `Symptom-severity.csv`: Severity weight (1-7) for various symptoms.

## ML Workflow & Model Training
1. **Preprocessing**: The dataset is loaded and cleaned (whitespace removed). Symptoms are transformed into a binary feature matrix matching the 132 known symptoms.
2. **Model Training**: A `DecisionTreeClassifier` and an `SVC` are trained on an 80/20 train/test split.
3. **Saving**: The trained models are serialized using `joblib` into `backend/models/`.

## Medical Safety Disclaimer
This tool provides educational information based on machine-learning predictions and is **not a medical diagnosis**. Consult a qualified healthcare professional for medical advice. If you are experiencing severe, sudden, or life-threatening symptoms, seek emergency medical care immediately.

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # (Windows)
pip install -r requirements.txt
```

### 2. Train Models
If models are not present, run:
```bash
python ml/train.py
```

### 3. Run Backend
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## Environment Variables (Optional for prod)
- `SECRET_KEY` (Auth)
- `ALGORITHM` (Auth)
