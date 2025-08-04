import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# --- THIS IS THE DAY 1 CODE YOU NEED TO ADD BACK ---

app = FastAPI()

# This tells the server where to find your 'static' files (like script.js)
app.mount("/static", StaticFiles(directory="static"), name="static")

# This sets up the template engine to find your HTML files
templates = Jinja2Templates(directory="templates")

# This is the route that serves your HTML page
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# --- END OF DAY 1 CODE ---


# --- THIS IS YOUR DAY 2/3 API ENDPOINT CODE (IT'S ALREADY GOOD) ---

# The Pydantic model for the incoming JSON
class TextRequest(BaseModel):
    text: str

MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"

@app.post("/generate-audio")
def generate_audio(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "voiceId": "en-US-marcus",
        "text": request.text,
        "format": "mp3"
    }

    try:
        response = requests.post(MURF_TTS_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Murf TTS API call failed: {e}")

    audio_url = data.get("audioFile")

    if not audio_url:
        raise HTTPException(status_code=500, detail=f"Audio URL not found in Murf API response: {data}")

    return {"audio_url": audio_url}