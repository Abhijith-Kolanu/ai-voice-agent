# AI Voice Agent 🎙️

This is a web-based, voice-first conversational AI agent created as part of the **#30DaysofVoiceAgents with Murf AI** challenge. The application allows a user to speak a question or command, and in return, receives a spoken response from the AI, creating a seamless and natural conversational experience.

The entire UI is designed to feel like a modern, polished mobile application, with clear visual states and a dynamic chat log.

---

## ✨ Features

-   **Voice-First Interaction:** Core functionality is based on voice input and audio output.
-   **Conversational Memory:** The agent remembers the context of the conversation within a session.
-   **Sleek, Modern UI:** A dark-themed, responsive interface with chat bubbles and a minimalist design.
-   **Clear State Management:** The UI provides clear visual feedback for `idle`, `listening`, `thinking`, and `speaking` states.
-   **"Live Text" Simulation:** The AI's response is typed out on screen, synchronized with the audio playback for an engaging user experience.
-   **Robust Error Handling:** Includes a pre-recorded fallback audio response if any part of the backend API pipeline fails.
-   **Session Management:** Each conversation has a unique session ID, managed via URL parameters.

---

## 🛠️ Tech Stack & Architecture

This project uses a client-server architecture to orchestrate multiple AI services.

**Tech Stack:**
-   **Backend:** Python with **FastAPI**
-   **Frontend:** Vanilla **HTML, CSS, & JavaScript**
-   **Speech-to-Text (STT):** **AssemblyAI**
-   **Language Model (LLM):** **Google Gemini**
-   **Text-to-Speech (TTS):** **Murf AI**

**Architecture Flow:**
1.  The **JavaScript frontend** uses the `MediaRecorder` API to capture the user's voice and sends it as an audio blob to the FastAPI server.
2.  The **FastAPI server** receives the audio and begins the processing pipeline:
    a. The audio is sent to **AssemblyAI** for accurate transcription.
    b. The transcribed text is appended to the session's chat history and sent to the **Google Gemini** API.
    c. Gemini's text response is sanitized and sent to the **Murf AI** API to be converted into high-quality speech.
3.  The server sends a JSON response back to the frontend containing the Murf AI audio URL and the original text from Gemini.
4.  The frontend plays the audio automatically and displays the user/AI conversation in the chat log with the live-typing effect.

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   Python 3.8+
-   An active virtual environment (recommended)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://your-repo-link.com/
    cd your-project-folder
    ```

2.  **Install the dependencies:**
    *(Make sure you have created a `requirements.txt` file by running `pip freeze > requirements.txt` in your terminal)*
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up your environment variables:**
    Create a file named `.env` in the root of the project and add your API keys:
    ```env
    # .env

    # Murf AI API Key (for Text-to-Speech)
    MURF_API_KEY="your_murf_api_key_here"

    # AssemblyAI API Key (for Speech-to-Text)
    ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"

    # Google Gemini API Key (for the LLM)
    GEMINI_API_KEY="your_gemini_api_key_here"
    ```

4.  **Run the FastAPI server:**
    ```bash
    uvicorn app:app --reload
    ```

5.  **Open your browser:**
    Navigate to `http://12.0.0.1:8000` to start using the voice agent.

---

## Acknowledgements
This project was built as part of the **#30DaysofVoiceAgents** challenge hosted by **Murf AI**. It was a fantastic learning experience in integrating multiple AI services to build a cohesive, voice-first application.