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


    //    AI Echo Bot Functionality (UPDATED FOR DAY 7)

    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordedAudioPlayer = document.getElementById('recordedAudio');
    const statusMessage = document.getElementById('status-message');
    const transcriptionResult = document.getElementById('transcription-result');

    // For Day 7, we don't need to show the transcription box. Let's hide it.
    if(transcriptionResult) {
        transcriptionResult.style.display = 'none';
    }

    if (!startButton || !stopButton || !recordedAudioPlayer || !statusMessage) {
        console.error("A required UI element is missing!");
        return;
    }

    let mediaRecorder;
    let recordedChunks = [];

    stopButton.disabled = true;

    // --- Start Recording Event ---
    startButton.addEventListener('click', async () => {
        recordedChunks = [];
        recordedAudioPlayer.src = '';
        statusMessage.textContent = '';
        if(transcriptionResult) transcriptionResult.textContent = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            // Event handler for when recording is stopped
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                
                // --- THIS IS THE KEY FIX ---
                // We COMMENT OUT the lines that play the user's own voice back immediately.
                /*
                const audioUrl = URL.createObjectURL(blob);
                recordedAudioPlayer.src = audioUrl;
                */
                
                stream.getTracks().forEach(track => track.stop());

                startButton.disabled = false;
                stopButton.disabled = true;
                startButton.textContent = 'Start Recording';

                // --- Call the ACTIVE Day 7 function ---
                getAiEcho(blob);

                // --- We COMMENT OUT the call to the old Day 6 function ---
                /*
                transcribeAudio(blob);
                */
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
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


    // --- Day 6 Function (Commented out, no longer active) ---
    /*
    const transcribeAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');
        statusMessage.textContent = 'Transcribing...';
        try {
            const response = await fetch('/transcribe/file', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = '✅ Transcription Successful!';
                transcriptionResult.textContent = data.transcript;
            } else {
                statusMessage.textContent = `❌ Transcription failed: ${data.detail}`;
            }
        } catch (error) {
            statusMessage.textContent = '❌ Transcription failed: Could not connect to the server.';
        }
    };
    */


    // --- Day 7 Function to Handle AI Echo (This one is ACTIVE) ---
    const getAiEcho = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio_data', audioBlob, 'recording.webm');

        statusMessage.textContent = 'Generating AI echo... (This may take a moment)';
        statusMessage.style.color = '#e0e0e0';

        try {
            const response = await fetch('/tts/echo', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = '✅ AI Echo Ready!';
                statusMessage.style.color = 'green';
                recordedAudioPlayer.src = data.audio_url;
                recordedAudioPlayer.play();
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