import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  sendMessageToLLM: (messages: Array<{ role: string; content: string }>, modelName?: string) =>
    ipcRenderer.invoke('chat:sendMessage', messages, modelName),
});
