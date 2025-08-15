import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_llm_response(session_history: list) -> str:
    """
    Gets a conversational response from the Google Gemini model.
    """
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured.")
        
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content(session_history)
    return response.text