// main.js
require('dotenv').config(); // Load variables from .env file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- IMPORTANT: API Key Handling ---
// Get your API key from environment variables for security
// HOW TO SET ENV VARIABLE:
// Linux/macOS: export GEMINI_API_KEY="YOUR_API_KEY"
// Windows (cmd): set GEMINI_API_KEY=YOUR_API_KEY
// Windows (PowerShell): $env:GEMINI_API_KEY="YOUR_API_KEY"
// You'll need to set this *before* running 'npm start'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;// This will now read from .env

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable not set.");
    // In a real app, you might want to show an error dialog to the user
    // For now, we'll exit if the key isn't found.
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
let chat; // To hold the chat session

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // Important security settings:
            contextIsolation: true, // Keep main and renderer contexts separate
            nodeIntegration: false, // Don't expose Node.js in the renderer
        },
    });

    mainWindow.loadFile('index.html');

    // Open DevTools - remove for production
    // mainWindow.webContents.openDevTools();
}

async function initializeChat() {
    try {
        // Use a model that supports multi-turn chat like 'gemini-pro'
        // "Gemini 2.0" isn't a specific model name in the API as of early 2024,
        // 'gemini-pro' is the standard generative text model.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        chat = model.startChat({
            // You can optionally add history or safety settings here
            // history: [ { role: "user", parts: "Hello." }, { role: "model", parts: "Hi there!" } ],
            // safetySettings: [ ... ],
            generationConfig: {
                // maxOutputTokens: 200, // Example configuration
            }
        });
        console.log("Gemini chat session initialized successfully.");
    } catch (error) {
        console.error("Error initializing Gemini chat:", error);
        // Handle initialization error (e.g., show error to user via IPC)
    }
}


app.whenReady().then(async () => {
    await initializeChat(); // Initialize chat *before* creating window or handling IPC

    // --- IPC Handler for Gemini Chat ---
    ipcMain.handle('gemini:chat', async (event, userMessage) => {
        if (!chat) {
            console.error("Chat not initialized.");
            return { error: "Chat service is not available. Please restart the app." };
        }
        console.log(`Received from renderer: ${userMessage}`);
        try {
            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            const text = response.text();
            console.log(`Sent to renderer: ${text}`);
            return { text: text }; // Send response back to renderer
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            // Provide a user-friendly error message
            return { error: `Failed to get response from AI: ${error.message || 'Unknown error'}` };
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});