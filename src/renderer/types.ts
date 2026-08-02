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

export interface LessonChat {
  id: string;
  title: string;
  status?: 'completed' | 'in_progress' | 'upcoming';
  messages: ChatMessage[];
}

export interface ModuleFolder {
  id: string;
  title: string;
  isExpanded?: boolean;
  lessons: LessonChat[];
}

export interface SkillCourse {
  id: string;
  title: string;
  progressPercent: number;
  modules: ModuleFolder[];
}

export type ThemeMode = 'dark' | 'light';

export interface LLMResponse {
  error: boolean;
  message: string;
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      sendMessageToLLM: (
        messages: Array<{ role: string; content: string }>,
        modelName?: string
      ) => Promise<LLMResponse>;
      streamMessageToLLM: (
        requestId: string,
        messages: Array<{ role: string; content: string }>,
        modelName?: string
      ) => Promise<void>;
      abortStream: (requestId: string) => Promise<void>;
      onTokenChunk: (
        callback: (data: { requestId: string; chunk: string }) => void
      ) => () => void;
      onStreamComplete: (
        callback: (data: { requestId: string }) => void
      ) => () => void;
      onStreamError: (
        callback: (data: { requestId: string; error: string }) => void
      ) => () => void;
      getAvailableModels: () => Promise<Array<{ id: string; name: string }>>;
    };
  }
}
