import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"  # Confirm exact endpoint from Murf docs

app = FastAPI()

class TextRequest(BaseModel):
    text: str

@app.post("/generate-audio")
def generate_audio(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "voiceId": "en-US-marcus",  # Replace with your desired voiceId
        "text": request.text,
        "format": "mp3"
    }

    # Debug prints to verify request content
    print("Headers:", headers)
    print("Payload:", payload)

    try:
        response = requests.post(MURF_TTS_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Murf TTS API call failed: {e}")

    # Debug print full response if needed
    # print("Murf API response:", data)

    audio_url = data.get("audioFile")

    if not audio_url:
        raise HTTPException(status_code=500, detail=f"Audio URL not found in Murf API response: {data}")

    return {"audio_url": audio_url}