import os
import assemblyai
from typing import IO
from dotenv import load_dotenv

load_dotenv()


ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
if ASSEMBLYAI_API_KEY:
    assemblyai.settings.api_key = ASSEMBLYAI_API_KEY

def transcribe_audio(audio_file: IO[bytes]) -> str:
    """
    Transcribes the given audio file using AssemblyAI.
    """
    if not ASSEMBLYAI_API_KEY:
        raise Exception("ASSEMBLYAI_API_KEY is not configured.")

    transcriber = assemblyai.Transcriber()
    transcript = transcriber.transcribe(audio_file)

    if transcript.error:
        raise Exception(f"AssemblyAI Error: {transcript.error}")
    
    transcribed_text = transcript.text
    if not transcribed_text or not transcribed_text.strip():
        raise Exception("Could not understand the audio.")
        
    return transcribed_text