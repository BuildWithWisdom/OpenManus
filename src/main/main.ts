import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { createStreamResponse } from './providers/providerFactory';
import { ChatMessagePayload } from './providers/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (started) {
  app.quit();
}

const activeStreams = new Map<string, { aborted: boolean }>();

ipcMain.handle(
  'chat:streamMessage',
  async (
    event,
    requestId: string,
    messages: Array<{ role: string; content: string }>,
    modelName?: string
  ) => {
    const senderWebContents = event.sender;
    const selectedModel = modelName || 'deepseek-ai/deepseek-v4-pro';
    const streamState = { aborted: false };
    activeStreams.set(requestId, streamState);

    let hasEmittedChunk = false;
    let isThinking = false;
    const connectionTimeoutTimer = setTimeout(() => {
      if (!hasEmittedChunk && !streamState.aborted && !senderWebContents.isDestroyed()) {
        streamState.aborted = true;
        senderWebContents.send('chat:onStreamError', {
          requestId,
          error: 'Connection to AI model timed out. Please try again.',
        });
      }
    }, 60000);

    try {
      const { type, response } = await createStreamResponse({
        modelName: selectedModel,
        messages: messages as ChatMessagePayload[],
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!streamState.aborted && !senderWebContents.isDestroyed()) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          if (trimmed === 'data: [DONE]') break;

          try {
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;
            const parsed = JSON.parse(jsonStr);

            const delta = parsed.choices?.[0]?.delta;
            const contentChunk: string | undefined =
              delta?.content ||
              parsed.response ||
              parsed.result?.response;
            const reasoningChunk: string | undefined =
              delta?.reasoning_content ||
              delta?.reasoning;

            if (reasoningChunk) {
              if (!hasEmittedChunk) {
                hasEmittedChunk = true;
                clearTimeout(connectionTimeoutTimer);
              }
              if (!isThinking) {
                isThinking = true;
                senderWebContents.send('chat:onTokenChunk', { requestId, chunk: '<think>\n' });
              }
              senderWebContents.send('chat:onTokenChunk', { requestId, chunk: reasoningChunk });
            }

            if (contentChunk) {
              if (!hasEmittedChunk) {
                hasEmittedChunk = true;
                clearTimeout(connectionTimeoutTimer);
              }
              if (isThinking) {
                isThinking = false;
                senderWebContents.send('chat:onTokenChunk', { requestId, chunk: '\n</think>\n\n' });
              }
              senderWebContents.send('chat:onTokenChunk', { requestId, chunk: contentChunk });
            }
          } catch {
            // Ignore partial SSE json parse errors
          }
        }
      }

      if (isThinking && !streamState.aborted && !senderWebContents.isDestroyed()) {
        isThinking = false;
        senderWebContents.send('chat:onTokenChunk', { requestId, chunk: '\n</think>\n\n' });
      }

      clearTimeout(connectionTimeoutTimer);
      if (!streamState.aborted && !senderWebContents.isDestroyed()) {
        senderWebContents.send('chat:onStreamComplete', { requestId });
      }
    } catch (err: unknown) {
      clearTimeout(connectionTimeoutTimer);
      const errorMessage = err instanceof Error ? err.message : 'Failed to stream response from Cloudflare AI Gateway.';
      console.error('[Cloudflare AI Error Details]:', errorMessage);
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('chat:onStreamError', {
          requestId,
          error: errorMessage,
        });
      }
    } finally {
      clearTimeout(connectionTimeoutTimer);
      activeStreams.delete(requestId);
    }
  }
);

ipcMain.handle('chat:getAvailableModels', async () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '8fcf60d206c33a3e9f758c983cfbf622';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?task=Text%20Generation`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    const data = await response.json();
    if (data.success && Array.isArray(data.result)) {
      const fetchedModels = data.result.map((modelItem: { name: string }) => ({
        id: modelItem.name,
        name: `${modelItem.name.replace('@cf/', '')} (Cloudflare AI)`,
      }));

      const customNvidiaModels = [
        { id: 'custom-nvidia/meta/llama-3.3-70b-instruct', name: 'llama-3.3-70b-instruct (NVIDIA NIM)' },
        { id: 'custom-nvidia/deepseek-ai/deepseek-r1', name: 'deepseek-r1 (NVIDIA NIM)' },
      ];

      return [...fetchedModels, ...customNvidiaModels];
    }
  } catch (error) {
    console.error('[Fetch Models Error]:', error);
  }

  return [
    { id: '@cf/moonshotai/kimi-k2.6', name: 'kimi-k2.6 (Cloudflare AI)' },
    { id: '@cf/meta/llama-3.1-8b-instruct', name: 'llama-3.1-8b-instruct (Cloudflare AI)' },
    { id: 'custom-nvidia/meta/llama-3.3-70b-instruct', name: 'llama-3.3-70b-instruct (NVIDIA NIM)' },
  ];
});

ipcMain.handle('chat:abortStream', (_event, requestId: string) => {
  const streamState = activeStreams.get(requestId);
  if (streamState) {
    streamState.aborted = true;
    activeStreams.delete(requestId);
  }
});

const createWindow = (): void => {
  Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
