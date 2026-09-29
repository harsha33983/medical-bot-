from pydantic import BaseModel
from typing import List

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PredictRequest(BaseModel):
    symptoms: List[str]

class PredictResponse(BaseModel):
    prediction: str
    prediction_svc: str
    prediction_dt: str
    description: str
    precautions: List[str]
    severity: List[dict]
    
class TTSRequest(BaseModel):
    text: str
