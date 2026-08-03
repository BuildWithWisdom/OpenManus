import { buildSystemPrompt } from '../prompts/promptBuilder';
import { ChatMessagePayload, StreamMessageOptions } from './types';

export async function createStreamResponse(options: StreamMessageOptions) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare API credentials. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your .env file.');
  }

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

  const modelName = options.modelName;
  const providerSlug = options.providerSlug || (modelName.startsWith('@cf/') ? 'workers-ai' : 'custom-nvidia');

  const endpoint = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${providerSlug}/v1/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'cf-aig-authorization': `Bearer ${apiToken}`,
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
