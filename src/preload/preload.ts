import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  sendMessageToLLM: (messages: Array<{ role: string; content: string }>, modelName?: string) =>
    ipcRenderer.invoke('chat:sendMessage', messages, modelName),
  streamMessageToLLM: (
    requestId: string,
    messages: Array<{ role: string; content: string }>,
    modelName?: string
  ) => ipcRenderer.invoke('chat:streamMessage', requestId, messages, modelName),
  abortStream: (requestId: string) => ipcRenderer.invoke('chat:abortStream', requestId),
  onTokenChunk: (
    callback: (data: { requestId: string; chunk: string }) => void
  ) => {
    const subscription = (_event: unknown, data: { requestId: string; chunk: string }) =>
      callback(data);
    ipcRenderer.on('chat:onTokenChunk', subscription);
    return () => ipcRenderer.removeListener('chat:onTokenChunk', subscription);
  },
  onStreamComplete: (
    callback: (data: { requestId: string }) => void
  ) => {
    const subscription = (_event: unknown, data: { requestId: string }) => callback(data);
    ipcRenderer.on('chat:onStreamComplete', subscription);
    return () => ipcRenderer.removeListener('chat:onStreamComplete', subscription);
  },
  onStreamError: (
    callback: (data: { requestId: string; error: string }) => void
  ) => {
    const subscription = (_event: unknown, data: { requestId: string; error: string }) =>
      callback(data);
    ipcRenderer.on('chat:onStreamError', subscription);
    return () => ipcRenderer.removeListener('chat:onStreamError', subscription);
  },
  getAvailableModels: () => ipcRenderer.invoke('chat:getAvailableModels'),
});
