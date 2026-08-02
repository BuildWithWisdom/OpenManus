import { buildSystemPrompt } from '../prompts/promptBuilder';
import { ChatMessagePayload, StreamMessageOptions } from './types';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '8fcf60d206c33a3e9f758c983cfbf622';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const GATEWAY_ID = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';

export async function createStreamResponse(options: StreamMessageOptions) {
  const systemPrompt = buildSystemPrompt({ personaId: options.personaId });
  const sanitizedMessages = options.messages
    .filter((messageItem: ChatMessagePayload) => messageItem.content && messageItem.content.trim().length > 0)
    .map((messageItem: ChatMessagePayload) => ({
      role: messageItem.role as 'user' | 'assistant',
      content: messageItem.content,
    }));

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...sanitizedMessages,
  ];

  const modelName = options.modelName || 'deepseek-ai/deepseek-v4-pro';
  const isWorkersAi = modelName.startsWith('@cf/');
  const providerSlug = isWorkersAi ? 'workers-ai' : 'custom-nvidia';

  const endpoint = `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_ID}/${GATEWAY_ID}/${providerSlug}/v1/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'cf-aig-authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: messagesPayload,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI Gateway Error (${response.status}): ${errorText}`);
  }

  return { type: 'cf-gateway' as const, response };
}
