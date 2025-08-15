from pydantic import BaseModel, HttpUrl

class ChatResponse(BaseModel):
    """
    Defines the successful response model for the chat endpoint.
    """
    audio_url: HttpUrl
    user_query: str
    ai_response: str