const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendMessage: (msg) => ipcRenderer.invoke('send-message', msg),
    onMessage: (cb) => ipcRenderer.on('chat-message', (_, data) => cb(data)),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    getConfig: () => ipcRenderer.invoke('get-config'),
    switchVideo: (videoId) => ipcRenderer.invoke('switch-video', videoId),
    onClearChat: (cb) => ipcRenderer.on('clear-chat', () => cb()),
    onShowVideoPrompt: (cb) => ipcRenderer.on('show-video-prompt', () => cb())
});