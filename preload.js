// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose a function to the renderer process called 'sendMessageToGemini'
  sendMessageToGemini: (message) => ipcRenderer.invoke('gemini:chat', message)
  // 'gemini:chat' is the channel name we listen for in main.js (ipcMain.handle)
});

console.log('Preload script loaded.');