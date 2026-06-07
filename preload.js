const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendMessage: (msg) => ipcRenderer.invoke('send-message', msg),
    onMessage: (cb) => ipcRenderer.on('chat-message', (_, data) => cb(data)),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});