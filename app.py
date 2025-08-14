import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, File, UploadFile
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from werkzeug.utils import secure_filename
import shutil

# Imports for AI Services
import assemblyai
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# --- FastAPI App Setup ---
app = FastAPI()
chat_history = {}
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
# Create assets directory if it doesn't exist to prevent errors
os.makedirs("assets", exist_ok=True)


# --- Configure API Keys ---
MURF_API_KEY = os.getenv("MURF_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure the SDKs
assemblyai.settings.api_key = ASSEMBLYAI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)
MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"


# --- ROUTES / ENDPOINTS ---

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

class TextRequest(BaseModel):
    text: str

@app.post("/generate-audio")
def generate_audio(request: TextRequest):
    headers = {"api-key": MURF_API_KEY, "Content-Type": "application/json"}
    payload = {"voiceId": "en-IN-aarav", "text": request.text, "format": "mp3"}
    try:
        response = requests.post(MURF_TTS_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        audio_url = data.get("audioFile")
        if not audio_url: raise HTTPException(status_code=500, detail="Audio URL not found in Murf response")
        return {"audio_url": audio_url}
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Murf TTS API call failed: {e}")

@app.post("/agent/chat/{session_id}/end")
async def end_chat_session(session_id: str):
    if session_id in chat_history:
        del chat_history[session_id]
        return {"message": "Conversation ended and history cleared."}
    return {"message": "No active session found to end."}


# --- Day 11: Conversational Endpoint with Robust Error Handling ---
@app.post("/agent/chat/{session_id}")
async def agent_chat(session_id: str, audio_data: UploadFile = File(...)):
    try:
        # --- HAPPY PATH: The entire multi-step AI pipeline ---
        
        # 1. Transcribe
        transcriber = assemblyai.Transcriber()
        transcript = transcriber.transcribe(audio_data.file)
        if transcript.error: raise Exception(f"AssemblyAI Error: {transcript.error}")
        transcribed_text = transcript.text
        if not transcribed_text or not transcribed_text.strip():
            raise Exception("Could not understand the audio, please try again.")
        
        # 2. Manage History
        session_history = chat_history.get(session_id, [])
        session_history.append({'role': 'user', 'parts': [transcribed_text]})
        
        # 3. Call LLM
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(session_history)
        llm_response_text = response.text
        
        # 4. Update History
        session_history.append({'role': 'model', 'parts': [llm_response_text]})
        chat_history[session_id] = session_history
        
        # 5. Handle Murf AI Character Limit
        final_text_for_murf = llm_response_text
        CHAR_LIMIT = 2800 
        if len(llm_response_text) > CHAR_LIMIT:
            truncation_notice = " That is a brief summary. I have more details if you'dlike to read them."
            safe_limit = CHAR_LIMIT - len(truncation_notice)
            last_period_index = llm_response_text.rfind('.', 0, safe_limit)
            if last_period_index != -1:
                final_text_for_murf = llm_response_text[:last_period_index + 1] + truncation_notice
            else:
                final_text_for_murf = llm_response_text[:safe_limit] + truncation_notice
        
        # 6. Synthesize Audio
        murf_headers = {"api-key": MURF_API_KEY, "Content-Type": "application/json"}
        murf_payload = {"voiceId": "en-IN-aarav", "text": final_text_for_murf, "format": "mp3"}
        murf_response = requests.post(MURF_TTS_URL, json=murf_payload, headers=murf_headers)
        murf_response.raise_for_status()
        murf_data = murf_response.json()
        murf_audio_url = murf_data.get("audioFile")
        if not murf_audio_url: raise Exception("Murf API did not return an audio file.")
        
        # 7. Return the successful JSON response
        return {
            "audio_url": murf_audio_url,
            "user_query": transcribed_text,
            "ai_response": llm_response_text
        }

    except Exception as e:
        # --- SAD PATH: If ANY of the above steps fail ---
        print(f"PIPELINE ERROR: An error occurred in the agent chat pipeline: {e}")
        
        # Add a custom header to identify this as a fallback audio response
        headers = {"X-Error-Type": "Fallback-Audio"}
        
        # Return the pre-recorded fallback audio file
        return FileResponse("assets/error_response.mp3", media_type="audio/mpeg", headers=headers)