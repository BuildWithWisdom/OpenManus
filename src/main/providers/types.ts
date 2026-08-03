export type ProviderType = 'stepfun' | 'openai' | 'anthropic' | 'google' | 'custom';

export interface ProviderConfig {
  provider: ProviderType;
  apiKey: string;
  baseURL?: string;
  modelName: string;
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamMessageOptions {
  modelName: string;
  providerSlug?: string;
  messages: ChatMessagePayload[];
  personaId?: string;
}
