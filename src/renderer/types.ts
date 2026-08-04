export type ThemeMode = 'dark' | 'light';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp?: string;
  updatedAt?: string;
  messages: ChatMessage[];
}

declare global {
  interface Window {
    electronAPI?: {
      platform?: string;
    };
  }
}

export {};
