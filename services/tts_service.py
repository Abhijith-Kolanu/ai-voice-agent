import os
import requests
from dotenv import load_dotenv

load_dotenv()


MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_TTS_URL = "https://api.murf.ai/v1/speech/generate-with-key"

def synthesize_speech(text: str) -> str:
    """
    Synthesizes speech from text using the Murf AI API.
    """

    if not MURF_API_KEY:
        raise Exception("MURF_API_KEY is not configured.")

    headers = {"api-key": MURF_API_KEY, "Content-Type": "application/json"}
    payload = {"voiceId": "en-IN-aarav", "text": text, "format": "mp3"}
    
    try:
        response = requests.post(MURF_TTS_URL, json=payload, headers=headers)
        response.raise_for_status() # Raises an exception for bad status codes
        data = response.json()
        audio_url = data.get("audioFile")
        if not audio_url:
            raise Exception("Murf API did not return an audio file.")
        return audio_url
    except requests.RequestException as e:
        raise Exception(f"Murf TTS API call failed: {e}")