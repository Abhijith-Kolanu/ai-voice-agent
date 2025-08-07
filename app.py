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

# Load environment variables from .env file
load_dotenv()

# --- THIS IS THE DAY 1 CODE (UNCHANGED) ---
app = FastAPI()

# Mount static files (like script.js)
app.mount("/static", StaticFiles(directory="static"), name="static")
# Set up templates (for index.html)
templates = Jinja2Templates(directory="templates")

# --- NEW: Ensure the 'uploads' folder exists ---
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# --- DAY 2/3 API ENDPOINT (UNCHANGED) ---
class TextRequest(BaseModel):
    text: str

MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"

@app.post("/generate-audio")
def generate_audio(request: TextRequest):
    # ... (this function remains exactly the same)
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