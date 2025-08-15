# AI Voice Agent 🎙️

This is a web-based, voice-first conversational AI agent. The application allows a user to speak a question and receive a spoken response from the AI, creating a seamless and natural conversational experience.

The UI is designed as a sleek, modern web interface inspired by mobile applications, featuring clear visual states and a dynamic chat log.

---

## ✨ Features

-   **Voice-First Interaction:** Core functionality is based on voice input and audio output.
-   **Conversational Memory:** The agent remembers the context of the conversation within a single session.
-   **Sleek, Modern UI:** A dark-themed web interface inspired by mobile design, featuring a clean chat-bubble display and minimalist controls.
-   **Clear State Management:** The UI provides visual feedback for `idle`, `listening`, `thinking`, and `speaking` states.
-   **Robust Error Handling:** Includes a pre-recorded fallback audio response if any part of the backend API pipeline fails.
-   **Session Management:** Each conversation has a unique session ID.

---

## 🛠️ Tech Stack & Architecture

This project uses a modular, service-oriented architecture to orchestrate multiple AI services.

**Tech Stack:**
-   **Backend:** Python with **FastAPI**
-   **Frontend:** Vanilla **HTML, CSS, & JavaScript**
-   **Data Validation:** **Pydantic**
-   **Speech-to-Text (STT):** **AssemblyAI**
-   **Language Model (LLM):** **Google Gemini (`gemini-1.5-flash-latest`)**
-   **Text-to-Speech (TTS):** **Murf AI**

**Architecture Flow:**
1.  The **JavaScript frontend** captures the user's voice and sends it to the FastAPI server.
2.  The main **`app.py`** acts as an orchestrator, handling the request and calling dedicated services for each task in the pipeline.
3.  The audio is processed by the **STT Service** (using AssemblyAI), the resulting text is sent to the **LLM Service** (using Google Gemini), and the final text response is sent to the **TTS Service** (using Murf AI).
4.  The server validates the final output using a **Pydantic schema** and sends a JSON response back to the frontend.
5.  The frontend plays the audio and displays the conversation in the chat log.

---

## 📁 Project Structure

The project is organized with a clean, modular structure for a professional FastAPI application.

```
VA/
│
├── .env                # Stores secret API keys (Not committed to Git)
├── .gitignore          # Specifies files and folders for Git to ignore
├── app.py              # The main FastAPI application orchestrator
├── README.md           # This documentation file
├── requirements.txt    # Lists the Python dependencies for the project
├── schemas.py          # Contains Pydantic models for data validation
│
├── assets/
│ └── error_response.mp3 # Fallback audio for error handling
│
├── services/
│ ├── stt_service.py     # Handles all Speech-to-Text logic (AssemblyAI)
│ ├── llm_service.py     # Handles all LLM logic (Google Gemini)
│ └── tts_service.py     # Handles all Text-to-Speech logic (Murf AI)
│
├── static/
│ ├── script.js          # Frontend JavaScript for interactivity
│ └── style.css          # CSS for styling the web interface
│
└── templates/
└── index.html           # The main HTML template for the UI

```

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   Python 3.8+
-   An active virtual environment (recommended)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Abhijith-Kolanu/VA.git
    cd VA
    ```

2.  **Create and activate the virtual environment:**
    *This keeps your project dependencies isolated.*
    
    ```bash
    # Create the virtual environment
    python -m venv venv
    ```
    ```bash
    # Activate the environment (use the command for your OS)

    # On Windows (Command Prompt or PowerShell):
    .\venv\Scripts\activate

    # On macOS & Linux (bash or zsh):
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    *Your terminal prompt should now show `(venv)`.*
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your environment variables:**
    Create a file named `.env` in the root of the project and add your API keys:
    ```env
    # .env
    MURF_API_KEY="your_murf_api_key"
    ASSEMBLYAI_API_KEY="your_assemblyai_key"
    GEMINI_API_KEY="your_gemini_api_key"
    ```

5.  **Run the FastAPI server:**
    ```bash
    uvicorn app:app --reload
    ```

6.  **Open your browser:**
    Navigate to `http://localhost:8000` to start using the voice agent.

---

## Acknowledgements

This project was built as part of the **#30DaysofVoiceAgents** challenge hosted by **Murf AI**. It was a fantastic learning experience in integrating multiple AI services to build a cohesive, voice-first application.