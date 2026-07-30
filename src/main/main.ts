import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('[DEBUG ENV LOADED]', {
  STEPFUN_API_KEY: process.env.STEPFUN_API_KEY ? `${process.env.STEPFUN_API_KEY.slice(0, 6)}...` : 'MISSING',
  STEPFUN_BASE_URL: process.env.STEPFUN_BASE_URL || 'NOT_SET',
  STEPFUN_MODEL: process.env.STEPFUN_MODEL || 'NOT_SET',
});

if (started) {
  app.quit();
}

const getStepFunClient = (): { client: OpenAI; baseURL: string } | null => {
  const apiKey = process.env.STEPFUN_API_KEY;
  if (!apiKey || apiKey === 'your_stepfun_api_key_here') {
    return null;
  }
  const baseURL = process.env.STEPFUN_BASE_URL || 'https://api.stepfun.com/step_plan/v1';
  return {
    client: new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    }),
    baseURL,
  };
};

ipcMain.handle('chat:sendMessage', async (_event, messages: Array<{ role: string; content: string }>, modelName?: string) => {
  const stepFun = getStepFunClient();
  if (!stepFun) {
    return {
      error: true,
      message: 'STEPFUN_API_KEY is not set. Please add your key to the project .env file.',
    };
  }

  try {
    const selectedModel = modelName || process.env.STEPFUN_MODEL || 'step-3.7-flash';
    console.log(`[StepFun Request] Sending prompt to model '${selectedModel}' at '${stepFun.baseURL}'...`);

    const systemMessage = {
      role: 'system' as const,
      content: `You are OpenManus, a state-of-the-art AI assistant. 
Always format your responses cleanly using GitHub-flavored Markdown. 
Guidelines:
1. Break down explanations into distinct sections using Markdown headings (e.g. ### Section Title).
2. Format key points using ordered or unordered lists with bold item labels (e.g., 1. **Step Name** → Description).
3. Place all code, configuration snippets, or technical commands in fenced code blocks with explicit language tags (e.g., \`\`\`typescript, \`\`\`python).
4. Use generous line breaks between paragraphs for maximum readability.`,
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const response = await stepFun.client.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages,
    });

    const replyContent = response.choices[0]?.message?.content || 'No response received from StepFun AI.';
    return {
      error: false,
      message: replyContent,
    };
  } catch (err: any) {
    console.error('[StepFun Error Details]:', err);
    return {
      error: true,
      message: `StepFun API Error: ${err?.message || 'Failed to communicate with StepFun AI.'}`,
    };
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
