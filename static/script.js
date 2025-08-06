// Wait for the entire HTML document to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

//    Text-to-Speech (TTS) Functionality
    
    const ttsButton = document.getElementById('generate-button');
    const ttsInput = document.getElementById('text-input');
    const audioPlayer = document.getElementById('audio-player');

    const handleGenerateSpeech = async () => {
        const text = ttsInput.value.trim();
        if (!text) {
            alert('You need to type something first!'); // Use alert since there's no error div
            return;
        }

        // Update UI
        ttsButton.disabled = true;
        ttsButton.textContent = 'Generating...';

        try {
            // This assumes you have a backend endpoint at '/generate-audio'
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
            // Restore button
            ttsButton.disabled = false;
            ttsButton.textContent = 'Generate Audio';
        }
    };

    if (ttsButton) {
        ttsButton.addEventListener('click', handleGenerateSpeech);
    }


//    Echo Bot Functionality
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordedAudioPlayer = document.getElementById('recordedAudio');

    // Check if essential elements exist
    if (!startButton || !stopButton || !recordedAudioPlayer) {
        console.error("Voice Recorder UI elements are missing from the HTML!");
        alert("A critical UI element is missing. The recorder cannot start.");
        return;
    }

    let mediaRecorder;
    let recordedChunks = [];
    let stream;

    // Set initial button state
    stopButton.disabled = true;

    // --- Start Recording Event ---
    startButton.addEventListener('click', async () => {
        recordedChunks = [];
        recordedAudioPlayer.src = ''; // Clear previous recording

        try {
            // Request microphone access
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Set up MediaRecorder
            mediaRecorder = new MediaRecorder(stream);

            // Event handler for when audio data is available
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

                // Release the microphone
                stream.getTracks().forEach(track => track.stop());

                // Update UI
                startButton.disabled = false;
                stopButton.disabled = true;
                startButton.textContent = 'Start Recording';
            };

            // Start recording and update UI
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            startButton.textContent = 'Recording...';

        } catch (error) {
            console.error('Recording error:', error);
            alert('Could not access microphone. Please check browser permissions. Error: ' + error.message);
            // Reset buttons on error
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    // --- Stop Recording Event ---
    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    // --- Initial Browser Support Check ---
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording. Please use a modern browser like Chrome or Firefox.');
        startButton.disabled = true;
    }
});