// Wait for the entire HTML document to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    //    Text-to-Speech (TTS) Functionality (Unchanged)
    
    const ttsButton = document.getElementById('generate-button');
    const ttsInput = document.getElementById('text-input');
    const audioPlayer = document.getElementById('audio-player');

    const handleGenerateSpeech = async () => {
        const text = ttsInput.value.trim();
        if (!text) {
            alert('You need to type something first!');
            return;
        }
        ttsButton.disabled = true;
        ttsButton.textContent = 'Generating...';
        try {
            const response = await fetch('/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const data = await response.json();
            if (response.ok && data.audio_url) {
                audioPlayer.src = data.audio_url;
                audioPlayer.play().catch(e => console.warn("Autoplay was blocked by the browser."));
            } else {
                alert(data.error || 'An unknown error occurred during speech generation.');
            }
        } catch (err) {
            alert('Could not connect to the server. ' + err.message);
        } finally {
            ttsButton.disabled = false;
            ttsButton.textContent = 'Generate Audio';
        }
    };

    if (ttsButton) {
        ttsButton.addEventListener('click', handleGenerateSpeech);
    }


    //    AI Assistant Functionality (UPDATED FOR DAY 9)

    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordedAudioPlayer = document.getElementById('recordedAudio');
    const statusMessage = document.getElementById('status-message');
    const transcriptionResult = document.getElementById('transcription-result');

    if (!startButton || !stopButton || !recordedAudioPlayer || !statusMessage || !transcriptionResult) {
        console.error("A required UI element is missing!");
        return;
    }

    let mediaRecorder;
    let recordedChunks = [];
    stopButton.disabled = true;

    // --- Start Recording Event ---
    startButton.addEventListener('click', async () => {
        // Reset all UI elements for a new query
        recordedChunks = [];
        recordedAudioPlayer.src = '';
        statusMessage.textContent = '';
        transcriptionResult.textContent = '';
        transcriptionResult.style.display = 'none'; // Hide the result box for the new request

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            // Event handler for when recording is stopped
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                startButton.disabled = false;
                stopButton.disabled = true;
                startButton.textContent = 'Start Recording';

                // We now call the active Day 9 function.
                processAudioQuery(blob);
            };

            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            startButton.textContent = 'Recording...';
        } catch (error) {
            alert('Could not access microphone. Please grant permission.');
        }
    });

    // --- Stop Recording Event ---
    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    // --- Day 5 Function (Commented out, for history) ---
    /*
    const uploadAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');
        statusMessage.textContent = 'Uploading...';
        try {
            const response = await fetch('/upload-audio', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = `✅ Uploaded: ${data.filename} (${Math.round(data.size_bytes / 1024)} KB)`;
            } else {
                statusMessage.textContent = `❌ Upload failed: ${data.detail}`;
            }
        } catch (error) {
            statusMessage.textContent = '❌ Upload failed: Could not connect to the server.';
        }
    };
    */

    // --- Day 6 Function (Commented out, for history) ---
    /*
    const transcribeAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');
        statusMessage.textContent = 'Transcribing...';
        try {
            const response = await fetch('/transcribe/file', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = '✅ Transcription Successful!';
                transcriptionResult.style.display = 'block';
                transcriptionResult.textContent = data.transcript;
            } else {
                statusMessage.textContent = `❌ Transcription failed: ${data.detail}`;
            }
        } catch (error) {
            statusMessage.textContent = '❌ Transcription failed: Could not connect to the server.';
        }
    };
    */
   
    // --- Day 7 Function (Commented out, for history) ---
    /*
    const getAiEcho = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');
        statusMessage.textContent = 'Generating AI echo...';
        try {
            const response = await fetch('/tts/echo', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = '✅ AI Echo Ready!';
                recordedAudioPlayer.src = data.audio_url;
                recordedAudioPlayer.play();
            } else {
                statusMessage.textContent = `❌ Error: ${data.detail}`;
            }
        } catch (error) {
            statusMessage.textContent = '❌ Error: Could not connect to the server.';
        }
    };
    */

    // --- Day 9 Function to Handle the Full Pipeline (This one is ACTIVE) ---
    const processAudioQuery = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');

        statusMessage.textContent = 'Thinking... (This may take a moment)';
        statusMessage.style.color = '#e0e0e0';

        try {
            const response = await fetch('/llm/query', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                statusMessage.textContent = '✅ Response ready!';
                statusMessage.style.color = 'green';
                
                // Load the AI's audio into the audio player
                recordedAudioPlayer.src = data.audio_url;
                recordedAudioPlayer.play()
                // Make the result box visible and display the formatted, full text
                transcriptionResult.style.display = 'block';
                transcriptionResult.innerHTML = `<strong>Your Query:</strong> ${data.user_query}<br><br><strong>AI Response:</strong><br>${data.ai_response.replace(/\n/g, '<br>')}`;

            } else {
                statusMessage.textContent = `❌ Error: ${data.detail}`;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            statusMessage.textContent = '❌ Error: Could not connect to the server.';
            statusMessage.style.color = 'red';
        }
    };

    // --- Initial Browser Support Check ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording.');
        startButton.disabled = true;
    }
});