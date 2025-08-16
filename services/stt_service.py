import os
import assemblyai
from dotenv import load_dotenv


load_dotenv()


ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
if ASSEMBLYAI_API_KEY:
    assemblyai.settings.api_key = ASSEMBLYAI_API_KEY

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes the audio file located at the given path using AssemblyAI.
    """
    if not ASSEMBLYAI_API_KEY:
        raise Exception("ASSEMBLYAI_API_KEY is not configured.")

    transcriber = assemblyai.Transcriber()
    
    transcript = transcriber.transcribe(file_path)

    if transcript.error:
        raise Exception(f"AssemblyAI Error: {transcript.error}")
    
    transcribed_text = transcript.text
    if not transcribed_text or not transcribed_text.strip():
        raise Exception("Could not understand the audio.")
        
    return transcribed_text