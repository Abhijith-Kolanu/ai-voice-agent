document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const endSessionButton = document.getElementById('endSessionButton');
    const chatLog = document.getElementById('chat-log');
    const statusMessage = document.getElementById('status-message');
    const assistantAudioPlayer = document.getElementById('assistantAudioPlayer');

    let sessionId;
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;
    let conversationStarted = false;

    // Session Management
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('session_id')) {
        sessionId = urlParams.get('session_id');
    } else {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        window.history.pushState({ path: `?session_id=${sessionId}` }, '', `?session_id=${sessionId}`);
    }

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        const cleanedText = text.replace(/[\*#]/g, '').replace(/\n/g, '<br>');
        messageElement.innerHTML = cleanedText;
        chatLog.appendChild(messageElement);
    };

    // Event Listeners
    recordButton.addEventListener('click', () => {
        isRecording ? stopRecording() : startRecording();
    });

    endSessionButton.addEventListener('click', () => {
        statusMessage.textContent = 'Ending session...';
        recordButton.disabled = true;
        endSessionButton.disabled = true;
        setTimeout(() => window.location.href = window.location.pathname, 1000);
    });

    assistantAudioPlayer.addEventListener('ended', () => {
        if (conversationStarted) {
            statusMessage.textContent = 'Ask a follow-up, or end the session.';
        } else {
            statusMessage.textContent = 'Click the microphone to start';
        }
        recordButton.disabled = false;
        endSessionButton.disabled = false;
        recordButton.classList.remove('recording');
    });

    // Core Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                processAudio(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;
            statusMessage.textContent = 'Listening...';
            recordButton.classList.add('recording');
        } catch (error) {
            statusMessage.textContent = 'Microphone access denied.';
        }
    };

    const stopRecording = () => {
        if (!mediaRecorder) return;
        mediaRecorder.stop();
        isRecording = false;
        statusMessage.textContent = 'Thinking...';
        recordButton.classList.remove('recording');
        recordButton.disabled = true;
        endSessionButton.disabled = true;
    };

    // Backend Communication
    const processAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');

        try {
            const response = await fetch(`/agent/chat/${sessionId}`, { method: 'POST', body: formData });

            if (response.headers.get("X-Error-Type") === "Fallback-Audio") {
                addMessage('Sorry, an error occurred. Please try again.', 'ai');
                assistantAudioPlayer.src = URL.createObjectURL(await response.blob());
            } else if (response.ok) {
                const data = await response.json();
                if (data.user_query) {
                    addMessage(data.user_query, 'user');
                }
                if (data.ai_response) {
                    addMessage(data.ai_response, 'ai');
                }
                assistantAudioPlayer.src = data.audio_url;
                conversationStarted = true; 
            } else {
                throw new Error('Server returned an error.');
            }

            statusMessage.textContent = 'Speaking...';
            assistantAudioPlayer.play();

        } catch (error) {
            addMessage('Could not connect to the server.', 'ai');
            statusMessage.textContent = 'Error. Click microphone to try again.';
            recordButton.disabled = false;
            endSessionButton.disabled = false;
        }
    };
});