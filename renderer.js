// renderer.js
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const statusIndicator = document.getElementById('status-indicator');

// --- Function to add a message to the chat window ---
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    // Basic Markdown-like formatting (simple example)
    // Replace **bold** with <b>bold</b>
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Replace *italic* with <i>italic</i>
    text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');
    // Replace ```code``` with <code>code</code> (simple inline)
    text = text.replace(/```(.*?)```/gs, '<code>$1</code>'); // Handle multiline code blocks simply
     // Replace `code` with <code>code</code>
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    // Replace newlines with <br> for display
    text = text.replace(/\n/g, '<br>');

    messageDiv.innerHTML = text; // Use innerHTML to render formatting tags

    chatMessages.appendChild(messageDiv);
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Function to show an error message ---
function showErrorMessage(text) {
     const errorDiv = document.createElement('div');
    errorDiv.classList.add('message', 'error-message');
    errorDiv.textContent = `Error: ${text}`;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Function to handle sending a message ---
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') {
        return; // Don't send empty messages
    }

    // Display user's message immediately
    addMessage(messageText, 'user');
    messageInput.value = ''; // Clear input field
    messageInput.disabled = true; // Disable input while waiting
    sendButton.disabled = true;
    statusIndicator.style.display = 'block'; // Show "Thinking..."

    try {
        // Call the main process function exposed via preload script
        // This sends the message to main.js for API call
        const response = await window.electronAPI.sendMessageToGemini(messageText);

        if (response.text) {
            addMessage(response.text, 'ai'); // Display AI's response
        } else if (response.error) {
             showErrorMessage(response.error); // Display error from main process
        } else {
             showErrorMessage("Received an unexpected response from the AI service.");
        }

    } catch (error) {
        console.error("Error communicating with main process:", error);
        showErrorMessage(`Could not send message: ${error.message || 'Unknown IPC error'}`);
    } finally {
         messageInput.disabled = false; // Re-enable input
         sendButton.disabled = false;
         statusIndicator.style.display = 'none'; // Hide "Thinking..."
         messageInput.focus(); // Set focus back to input
    }
}

// --- Event Listeners ---
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    // Send message on Enter key press (Shift+Enter for newline is default browser behavior)
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent default Enter behavior (like adding a newline)
        sendMessage();
    }
});

// --- Initial focus ---
messageInput.focus();