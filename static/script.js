// Wait for the entire HTML document to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    //    Text-to-Speech (TTS) Functionality 
    
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


    //    Echo Bot Functionality & File Upload (UPDATED FOR DAY 5)

    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordedAudioPlayer = document.getElementById('recordedAudio');
    // --- NEW: Get the status div from the HTML ---
    const uploadStatus = document.getElementById('upload-status');

    // --- NEW: Add the new element to the check ---
    if (!startButton || !stopButton || !recordedAudioPlayer || !uploadStatus) {
        console.error("Voice Recorder UI elements are missing from the HTML!");
        alert("A critical UI element is missing. The recorder cannot start.");
        return;
    }

    let mediaRecorder;
    let recordedChunks = [];
    let stream;

    stopButton.disabled = true;

    // --- Start Recording Event ---
    startButton.addEventListener('click', async () => {
        recordedChunks = [];
        recordedAudioPlayer.src = ''; 
        // --- NEW: Clear the status message on new recording ---
        uploadStatus.textContent = ''; 

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
                const audioUrl = URL.createObjectURL(blob);
                recordedAudioPlayer.src = audioUrl;
                stream.getTracks().forEach(track => track.stop());

                // Update UI buttons
                startButton.disabled = false;
                stopButton.disabled = true;
                startButton.textContent = 'Start Recording';

                // --- NEW: CALL THE UPLOAD FUNCTION ---
                uploadAudio(blob);
            };

            // Start recording and update UI
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            startButton.textContent = 'Recording...';

        } catch (error) {
            console.error('Recording error:', error);
            alert('Could not access microphone. Please check browser permissions. Error: ' + error.message);
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    // --- Stop Recording Event (No change needed here) ---
    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    // --- NEW: FUNCTION TO HANDLE THE FILE UPLOAD ---
    const uploadAudio = async (audioBlob) => {
        // Prepare the data to be sent
        const formData = new FormData();
        // The key 'audio_data' MUST match the parameter name in your FastAPI endpoint
        formData.append('audio_data', audioBlob, 'recording.webm');

        // Update the UI to show that uploading has started
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.style.color = '#333'; // Reset color

        try {
            // Send the file to the server
            const response = await fetch('/upload-audio', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Display success message from the server
                uploadStatus.textContent = `✅ Uploaded: ${data.filename} (${Math.round(data.size_bytes / 1024)} KB)`;
                uploadStatus.style.color = 'green';
            } else {
                // Display error message from the server
                uploadStatus.textContent = `❌ Upload failed: ${data.detail}`;
                uploadStatus.style.color = 'red';
            }
        } catch (error) {
            // Handle network errors
            uploadStatus.textContent = '❌ Upload failed: Could not connect to the server.';
            uploadStatus.style.color = 'red';
            console.error('Network or server error:', error);
        }
    };

    // --- Initial Browser Support Check (No change needed here) ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording. Please use a modern browser like Chrome or Firefox.');
        startButton.disabled = true;
    }
});