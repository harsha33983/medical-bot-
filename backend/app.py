import os
import pandas as pd
import numpy as np
import joblib
import pickle
import pyttsx3
import uuid
import asyncio
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from db import SessionLocal, engine
import db_models
import schemas
import auth

# Create tables
db_models.Base.metadata.create_all(bind=engine)

# Load Models & Datasets
base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, 'data')
models_dir = os.path.join(base_dir, 'models')
static_dir = os.path.join(base_dir, 'static')
os.makedirs(static_dir, exist_ok=True)

class MLModel:
    svc_model = None
    dt_model = None
    symptoms_list = []
    descriptions = {}
    precautions = {}
    severities = {}

ml_model = MLModel()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load Models
    try:
        ml_model.svc_model = joblib.load(os.path.join(models_dir, 'svc.joblib'))
        ml_model.dt_model = joblib.load(os.path.join(models_dir, 'decision_tree.joblib'))
    except Exception as e:
        print(f"Models not found, please train them first: {e}")

    # Load symptoms list
    try:
        with open(os.path.join(data_dir, 'list_of_symptoms.pickle'), 'rb') as f:
            ml_model.symptoms_list = pickle.load(f)
    except:
        pass

    # Load descriptions
    try:
        desc_df = pd.read_csv(os.path.join(data_dir, 'symptom_Description.csv'))
        # Ensure column names match
        if 'Disease' in desc_df.columns and 'Description' in desc_df.columns:
            for _, row in desc_df.iterrows():
                ml_model.descriptions[row['Disease'].strip()] = row['Description']
    except:
        pass

    # Load precautions
    try:
        prec_df = pd.read_csv(os.path.join(data_dir, 'symptom_precaution.csv'))
        for _, row in prec_df.iterrows():
            disease = row['Disease'].strip() if pd.notna(row['Disease']) else ""
            precs = [row[f'Precaution_{i}'] for i in range(1, 5) if pd.notna(row[f'Precaution_{i}'])]
            ml_model.precautions[disease] = precs
    except:
        pass

    # Load severity
    try:
        sev_df = pd.read_csv(os.path.join(data_dir, 'Symptom-severity.csv'))
        for _, row in sev_df.iterrows():
            if 'Symptom' in sev_df.columns and 'weight' in sev_df.columns:
                symptom = str(row['Symptom']).strip()
                ml_model.severities[symptom] = int(row['weight'])
    except:
        pass
    
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/auth/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(db_models.User).filter(db_models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = db_models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(db_models.User).filter(db_models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/symptoms")
def get_symptoms():
    return {"symptoms": ml_model.symptoms_list}

@app.post("/api/predict", response_model=schemas.PredictResponse)
def predict(req: schemas.PredictRequest, current_user: str = Depends(auth.verify_token)):
    if not ml_model.svc_model or not ml_model.symptoms_list:
        raise HTTPException(status_code=503, detail="Models not loaded")

    input_vector = np.zeros(len(ml_model.symptoms_list))
    
    req_symptoms = [s.replace(' ', '_') for s in req.symptoms]
    severity_info = []

    for i, s in enumerate(ml_model.symptoms_list):
        s_clean = s.replace('_', '')
        for rs in req_symptoms:
            rs_clean = rs.replace('_', '')
            if s_clean == rs_clean:
                input_vector[i] = 1
                sev = ml_model.severities.get(s, ml_model.severities.get(rs, 0))
                severity_info.append({"symptom": rs, "severity": sev})
                break
                
    if np.sum(input_vector) == 0:
        raise HTTPException(status_code=400, detail="No recognized symptoms provided")

    # Predict using SVC and Decision Tree
    prediction_svc = ml_model.svc_model.predict([input_vector])[0]
    prediction_dt = ml_model.dt_model.predict([input_vector])[0]
    
    # We use SVC as the primary prediction for details, but return both
    prediction = prediction_svc
    
    # Retrieve details
    desc = ml_model.descriptions.get(prediction, "Description not available.")
    precs = ml_model.precautions.get(prediction, ["Consult a doctor"])

    return schemas.PredictResponse(
        prediction=prediction,
        prediction_svc=prediction_svc,
        prediction_dt=prediction_dt,
        description=desc,
        precautions=precs,
        severity=severity_info
    )

def generate_tts_audio(text: str, filename: str):
    engine = pyttsx3.init()
    engine.save_to_file(text, filename)
    engine.runAndWait()

@app.post("/api/tts")
async def tts(req: schemas.TTSRequest):
    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(static_dir, filename)
    # Run TTS in a separate thread since pyttsx3 is blocking
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, generate_tts_audio, req.text, filepath)
    return {"audio_url": f"/static/{filename}"}

@app.get("/static/{filename}")
def get_audio(filename: str):
    filepath = os.path.join(static_dir, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Audio file not found")
