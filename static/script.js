document.addEventListener('DOMContentLoaded', () => {
    // --- Get UI Elements ---
    const recordButton = document.getElementById('recordButton');
    const statusMessage = document.getElementById('status-message');

    // --- WebSocket and MediaRecorder State ---
    let socket;
    let mediaRecorder;
    let isRecording = false;

    // --- Function to Setup WebSocket Connection ---
    const setupWebSocket = () => {
        // Establish a connection to our /ws endpoint
        socket = new WebSocket("ws://localhost:8000/ws");

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            statusMessage.textContent = 'Click the microphone to start streaming.';
            recordButton.disabled = false;
        };

        socket.onmessage = (event) => {
            console.log("Received from server:", event.data);
            statusMessage.textContent = event.data; // Display server message
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed.");
            statusMessage.textContent = 'Connection closed. Refresh to reconnect.';
            recordButton.disabled = true;
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            statusMessage.textContent = 'Connection error.';
            recordButton.disabled = true;
        };
    };
    
    // --- Main Record Button Logic ---
    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            startStreaming();
        } else {
            stopStreaming();
        }
    });

    const startStreaming = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            // This event fires whenever a new chunk of audio is ready
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    // Send the binary audio data chunk over the WebSocket
                    socket.send(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                isRecording = true;
                statusMessage.textContent = 'Streaming audio to server...';
                recordButton.classList.add('recording');
            };
            
            mediaRecorder.onstop = () => {
                isRecording = false;
                statusMessage.textContent = 'Streaming stopped. Waiting for server...';
                recordButton.classList.remove('recording');
                // Send a signal to the server that the stream has ended
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send("END_OF_STREAM");
                }
                // Stop the user's microphone tracks
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording and collect chunks every 1 second (1000ms)
            mediaRecorder.start(1000);

        } catch (error) {
            console.error('Microphone access error:', error);
            statusMessage.textContent = 'Microphone access denied.';
        }
    };

    const stopStreaming = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    };
    
    // --- Initialize the application ---
    recordButton.disabled = true;
    setupWebSocket();
});