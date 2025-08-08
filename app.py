import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from werkzeug.utils import secure_filename
import shutil

# --- NEW IMPORTS for Day 6 ---
import assemblyai

# Load environment variables from .env file
load_dotenv()

# --- FastAPI App Setup ---
app = FastAPI()

# Mount static files and templates (Unchanged)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# This folder is still needed for the commented-out Day 5 code
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Configure API Keys ---
MURF_API_KEY = os.getenv("MURF_API_KEY")

# NEW: Configure AssemblyAI with your API key
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
if not ASSEMBLYAI_API_KEY:
    raise Exception("Missing ASSEMBLYAI_API_KEY environment variable. Please add it to your .env file.")
assemblyai.settings.api_key = ASSEMBLYAI_API_KEY


# --- ROUTES / ENDPOINTS ---

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Day 2/3 Endpoint for Text-to-Speech (Unchanged)
class TextRequest(BaseModel):
    text: str

MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"

@app.post("/generate-audio")
def generate_audio(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    headers = {"api-key": MURF_API_KEY, "Content-Type": "application/json"}
    payload = {"voiceId": "en-US-marcus", "text": request.text, "format": "mp3"}
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


# --- Day 5 Endpoint (Commented out as requested, no longer active) ---
"""
@app.post("/upload-audio")
async def upload_audio(audio_data: UploadFile = File(...)):
    try:
        filename = secure_filename(audio_data.filename)
        save_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(audio_data.file, buffer)

        file_size = os.path.getsize(save_path)

        return {
            "message": "File uploaded successfully",
            "filename": filename,
            "content_type": audio_data.content_type,
            "size_bytes": file_size,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {e}")
"""


# --- NEW: Day 6 Transcription Endpoint (This one is ACTIVE) ---

@app.post("/transcribe/file")
async def transcribe_audio(audio_data: UploadFile = File(...)):
    try:
        transcriber = assemblyai.Transcriber()
        transcript = transcriber.transcribe(audio_data.file)

        if transcript.error:
            raise HTTPException(status_code=500, detail=transcript.error)

        return {"transcript": transcript.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during transcription: {e}")


@app.post("/tts/echo")
async def tts_echo(audio_data: UploadFile = File(...)):
    try:
        # --- PART 1: Transcribe the incoming audio ---
        transcriber = assemblyai.Transcriber()
        transcript = transcriber.transcribe(audio_data.file)

        if transcript.error:
            raise HTTPException(status_code=500, detail=f"AssemblyAI Error: {transcript.error}")
        
        transcribed_text = transcript.text
        
        # --- PART 2: Send the transcribed text to Murf AI ---
        murf_headers = {
            "api-key": MURF_API_KEY,
            "Content-Type": "application/json"
        }
        
        murf_payload = {
            "voiceId": "en-US-marcus", # You can change this voice ID if you want
            "text": transcribed_text,
            "format": "mp3"
        }

        # Make the API call to Murf
        response = requests.post(MURF_TTS_URL, json=murf_payload, headers=murf_headers)
        response.raise_for_status() # Raise an exception for bad status codes
        
        murf_data = response.json()
        murf_audio_url = murf_data.get("audioFile")

        if not murf_audio_url:
            raise HTTPException(status_code=500, detail="Murf API did not return an audio file.")

        # --- PART 3: Return the final Murf audio URL ---
        return {"audio_url": murf_audio_url}

    except Exception as e:
        # A general error handler for any unexpected issues
        raise HTTPException(status_code=500, detail=f"An error occurred in the echo process: {e}")