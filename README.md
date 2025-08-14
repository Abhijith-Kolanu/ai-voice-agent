# AI Voice Agent 🎙️ (A Work in Progress)

This repository documents my progress through the **#30DaysofVoiceAgents with Murf AI** challenge. It is a web-based, voice-first conversational AI agent that allows a user to speak a question and receive a spoken response from an AI.

The UI is designed as a sleek, modern web interface inspired by mobile applications, featuring clear visual states and a dynamic chat log.
---

##  STATUS: DAY 13 of 30

This project is actively under development as part of a 30-day challenge. The current state of the code reflects the completion of **Day 13**. New features, code refinements, and documentation will be added daily.

---

## ✨ Features (As of Day 13)

-   **Voice-First Interaction:** Core functionality is based on voice input and audio output.
-   **Conversational Memory:** The agent remembers the context of the conversation within a single session.
-   **Sleek, Modern UI:** A dark-themed web interface inspired by mobile design, featuring a clean chat-bubble display and minimalist controls.
-   **Clear State Management:** The UI provides visual feedback for `idle`, `listening`, `thinking`, and `speaking` states.
-   **Robust Error Handling:** Includes a pre-recorded fallback audio response if any part of the backend API pipeline fails.
-   **Session Management:** Each conversation has a unique session ID.
---

## 🛠️ Tech Stack & Architecture

This project uses a client-server architecture to orchestrate multiple AI services.

**Tech Stack:**
-   **Backend:** Python with **FastAPI**
-   **Frontend:** Vanilla **HTML, CSS, & JavaScript**
-   **Speech-to-Text (STT):** **AssemblyAI**
-   **Language Model (LLM):** **Google Gemini (`gemini-1.5-flash-latest`)**
-   **Text-to-Speech (TTS):** **Murf AI**

**Architecture Flow:**
1.  The **JavaScript frontend** uses the `MediaRecorder` API to capture the user's voice and sends it to the FastAPI server.
2.  The **FastAPI server** receives the audio and begins the processing pipeline:
    a. The audio is transcribed by **AssemblyAI**.
    b. The text is sent to **Google Gemini** for a conversational response.
    c. Gemini's text response is sanitized and sent to **Murf AI** to be converted into speech.
3.  The server sends back the audio URL and the original text response.
4.  The frontend plays the audio and displays the conversation in the chat log.

---

## 📁 Project Structure

The project is organized with a standard structure for a FastAPI web application.
```
VA/
│
├── .env                 # Stores secret API keys (Not committed to Git)
├── .gitignore           # Specifies files and folders for Git to ignore
├── app.py               # The main FastAPI application server
├── README.md            # This documentation file
├── requirements.txt     # Lists the Python dependencies for the project
│
├── assets/
│ └── error_response.mp3 # A fallback audio file for error handling
│
├── static/
│ ├── script.js          # Frontend JavaScript for interactivity and API calls
│ └── style.css          # CSS for styling the web interface
│
└── templates/
└── index.html           # The main HTML template for the user interface
```
## 🚀 Getting Started

Follow these instructions to get the project running in its current (Day 13) state.

### Prerequisites

-   Python 3.8+
-   An active virtual environment (recommended)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Abhijith-Kolanu/VA.git
    cd VA
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
    MURF_API_KEY=your_murf_api_key

    # AssemblyAI API Key (for Speech-to-Text)
    ASSEMBLYAI_API_KEY=your_assemblyai_api_key

    # Google Gemini API Key (for the LLM)
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the FastAPI server:**
    ```bash
    uvicorn app:app --reload
    ```

5.  **Open your browser:**
    Navigate to `http://localhost:8000` to start using the voice agent.

---

## Acknowledgements
This project is being built as part of the **#30DaysofVoiceAgents** challenge hosted by **Murf AI**. It has been a fantastic learning experience in integrating multiple AI services to build a cohesive, voice-first application.