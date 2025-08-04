// function sayHello() {
//     alert("Hello, your are done with the project setup using FastAPI!");
// }


// Wait until the entire HTML document is loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // Get references to the HTML elements we need to interact with
    const textInput = document.getElementById('text-input');
    const generateButton = document.getElementById('generate-button');
    const audioPlayer = document.getElementById('audio-player');

    // Add a click event listener to the "Generate Audio" button
    generateButton.addEventListener('click', async () => {
        // Get the text from the input field
        const textToSpeak = textInput.value;

        // Basic validation: Make sure the text field isn't empty
        if (!textToSpeak.trim()) {
            alert('Please enter some text.');
            return;
        }

        // Optional: Show a loading state to the user
        generateButton.textContent = 'Generating...';
        generateButton.disabled = true;

        try {
            // Use the fetch API to send a POST request to our backend endpoint
            const response = await fetch('/generate-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Convert the JavaScript object to a JSON string
                body: JSON.stringify({
                    text: textToSpeak,
                    // You can specify voice/style here if you want to override the defaults
                    // voice: "en-US-RyanNeural", 
                    // style: "chat"
                }),
            });

            // Check if the request was successful
            if (!response.ok) {
                // If not, try to get the error message from the server's response
                const errorData = await response.json();
                throw new Error(errorData.detail || 'An unknown error occurred.');
            }

            // If successful, parse the JSON response from our backend
            const data = await response.json();
            const audioUrl = data.audio_url;

            // Set the 'src' of the audio player to the URL we received
            audioPlayer.src = audioUrl;

            // Tell the audio player to start playing the audio automatically
            audioPlayer.play();

        } catch (error) {
            // If anything goes wrong, log the error and show an alert to the user
            console.error('Error generating audio:', error);
            alert('Failed to generate audio. Please check the console for details.');
        } finally {
            // Re-enable the button and reset its text, whether the request succeeded or failed
            generateButton.textContent = 'Generate Audio';
            generateButton.disabled = false;
        }
    });
});