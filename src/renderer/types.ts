export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export type ThemeMode = 'dark' | 'light';
