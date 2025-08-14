// Wait for the entire HTML document to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    // --- Session ID Management ---
    let sessionId;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('session_id')) {
        sessionId = urlParams.get('session_id');
    } else {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        window.location.search = `?session_id=${sessionId}`;
    }

    // --- Get UI Elements ---
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const stopConversationButton = document.getElementById('stopConversation');
    const assistantAudioPlayer = document.getElementById('recordedAudio');
    const statusMessage = document.getElementById('status-message');
    const transcriptionResult = document.getElementById('transcription-result');

    let mediaRecorder;
    let recordedChunks = [];
    
    // --- Centralized UI Reset Function ---
    const resetUIForNewQuery = (message) => {
        statusMessage.textContent = message;
        startButton.disabled = false;
        stopButton.disabled = true;
        stopConversationButton.disabled = true;
        startButton.textContent = 'Start Recording';
        transcriptionResult.style.display = 'none';
        transcriptionResult.innerHTML = ''; // Clear previous results
        assistantAudioPlayer.src = '';
    };

    // Set the initial UI state
    resetUIForNewQuery('Click "Start Recording" to begin.');

    // --- Start & Stop Recording Logic ---
    startButton.addEventListener('click', async () => {
        recordedChunks = [];
        statusMessage.textContent = 'Listening...';
        transcriptionResult.style.display = 'none';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                processConversationalAudio(blob);
            };
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            stopConversationButton.disabled = true;
            startButton.textContent = 'Recording...';
        } catch (error) {
            console.error('Microphone access error:', error);
            resetUIForNewQuery('Microphone access denied. Please refresh and allow access.');
        }
    });

    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    // --- Stop Conversation Event Listener ---
    stopConversationButton.addEventListener('click', async () => {
        statusMessage.textContent = 'Ending session...';
        startButton.disabled = true;
        stopConversationButton.disabled = true;
        try {
            await fetch(`/agent/chat/${sessionId}/end`, { method: 'POST' });
        } catch (error) {
            console.error("Failed to notify server of session end:", error);
        }
        setTimeout(() => {
            // Reload the page to a clean URL, which will auto-generate a new session ID.
            window.location.href = window.location.pathname; 
        }, 1500);
    });

    // --- Main Function to Handle a Single Conversational Turn ---
    const processConversationalAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');
        statusMessage.textContent = 'Thinking...';
        startButton.disabled = true;
        stopButton.disabled = true;

        try {
            const response = await fetch(`/agent/chat/${sessionId}`, {
                method: 'POST',
                body: formData
            });

            // --- KEY CHANGE STARTS HERE ---
            
            // Check if the server sent our custom fallback audio header
            if (response.headers.get("X-Error-Type") === "Fallback-Audio") {
                console.log("Server returned fallback audio.");
                statusMessage.textContent = 'An error occurred. Playing fallback message.';
                
                // Get the response as an audio blob
                const audioBlob = await response.blob();
                const fallbackAudioURL = URL.createObjectURL(audioBlob);
                
                assistantAudioPlayer.src = fallbackAudioURL;
                assistantAudioPlayer.play();

                // When the fallback audio finishes, reset for the next turn
                assistantAudioPlayer.addEventListener('ended', () => {
                    resetUIForNewQuery('Please try your query again.');
                }, { once: true });

            } else if (response.ok) {
                // This is the "Happy Path" - we received a JSON response
                const data = await response.json();
                
                statusMessage.textContent = 'Speaking...';
                assistantAudioPlayer.src = data.audio_url;
                transcriptionResult.style.display = 'block';
                transcriptionResult.innerHTML = `<strong>Your Query:</strong> ${data.user_query}<br><br><strong>AI Response:</strong><br>${data.ai_response.replace(/\n/g, '<br>')}`;
                
                assistantAudioPlayer.play();
                
                // When the main audio finishes, enable the next turn
                assistantAudioPlayer.addEventListener('ended', () => {
                    statusMessage.textContent = 'Ready for your next query.';
                    startButton.disabled = false;
                    stopConversationButton.disabled = false;
                }, { once: true });

            } else {
                // Handle other server-side errors that might still return JSON
                const errorData = await response.json();
                console.error("Server error:", errorData);
                resetUIForNewQuery(`❌ Server Error: ${errorData.detail || 'Unknown error'}`);
            }
            // --- KEY CHANGE ENDS HERE ---

        } catch (error) {
            // Handle network errors or other unexpected issues
            console.error("Fetch/network error:", error);
            resetUIForNewQuery('❌ Error: Could not connect to the server.');
        }
    };
});