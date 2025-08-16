import os
import re
import logging
import shutil
import uuid
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, File, UploadFile
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import WebSocket, WebSocketDisconnect

# Import our new modules
from schemas import ChatResponse
from services import stt_service, llm_service, tts_service

load_dotenv()

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- FastAPI App Setup ---
app = FastAPI()
chat_history = {}
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Create a temporary directory for audio files ---
TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)


# --- ROUTES / ENDPOINTS ---

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/agent/chat/{session_id}/end")
async def end_chat_session(session_id: str):
    if session_id in chat_history:
        del chat_history[session_id]
        logging.info(f"Chat session {session_id} ended and history cleared.")
        return {"message": "Conversation ended and history cleared."}
    return {"message": "No active session found to end."}


@app.post("/agent/chat/{session_id}", response_model=ChatResponse)
async def agent_chat(session_id: str, audio_data: UploadFile = File(...)):
    
    # --- Define a temporary file path ---
    # We use uuid to create a unique filename to prevent conflicts
    temp_file_path = TEMP_DIR / f"{uuid.uuid4()}.webm"

    try:
        # --- NEW: Save the uploaded file to disk ---
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(audio_data.file, buffer)
        
        # 1. Transcribe audio using the saved file's path
        logging.info(f"[{session_id}] Transcribing audio from file: {temp_file_path}")
        transcribed_text = stt_service.transcribe_audio(str(temp_file_path))
        logging.info(f"[{session_id}] Transcribed text: {transcribed_text}")
        
        # 2. Manage and get chat history
        session_history = chat_history.get(session_id, [])
        session_history.append({'role': 'user', 'parts': [transcribed_text]})
        
        # 3. Get LLM response using our LLM service
        logging.info(f"[{session_id}] Getting LLM response...")
        llm_response_text = llm_service.get_llm_response(session_history)
        logging.info(f"[{session_id}] LLM response: {llm_response_text}")
        
        # 4. Update chat history with the LLM's response
        session_history.append({'role': 'model', 'parts': [llm_response_text]})
        chat_history[session_id] = session_history
        
        # 5. Sanitize and prepare text for TTS
        sanitized_text = re.sub(r'[\*#]', '', llm_response_text)
        final_text_for_tts = sanitized_text[:2800] # Simple truncation
        
        # 6. Synthesize speech using our TTS service
        logging.info(f"[{session_id}] Synthesizing speech...")
        audio_url = tts_service.synthesize_speech(final_text_for_tts)
        logging.info(f"[{session_id}] Synthesized audio URL: {audio_url}")
        
        # 7. Return the successful response using our Pydantic model
        return ChatResponse(
            audio_url=audio_url,
            user_query=transcribed_text,
            ai_response=llm_response_text
        )

    except Exception as e:
        logging.error(f"PIPELINE ERROR for session {session_id}: {e}", exc_info=True)
        headers = {"X-Error-Type": "Fallback-Audio"}
        return FileResponse("assets/error_response.mp3", media_type="audio/mpeg", headers=headers)
    
    finally:
        # This 'finally' block ensures the temp file is deleted even if an error occurs
        if temp_file_path.exists():
            os.remove(temp_file_path)
            logging.info(f"[{session_id}] Cleaned up temporary file: {temp_file_path}")


# --- WebSocket Endpoint for Real-time Communication ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # This is the first step. The server accepts the client's connection request.
    await websocket.accept()
    logging.info("WebSocket connection established.")
    
    try:
        # This loop keeps the connection alive, constantly waiting for new messages.
        while True:
            # The server waits here until it receives a message from the client.
            data = await websocket.receive_text()
            logging.info(f"WebSocket received message: {data}")
            
            # The server sends a response back to the same client.
            await websocket.send_text(f"Message text was: {data}")
            logging.info(f"WebSocket echoed message: {data}")

    except WebSocketDisconnect:
        # This block runs if the client disconnects (e.g., closes the Postman tab).
        logging.info("WebSocket connection closed.")
    except Exception as e:
        # This is a safety net for any other errors.
        logging.error(f"WebSocket error: {e}")