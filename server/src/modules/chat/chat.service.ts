import { Context } from 'hono';
import { env } from 'hono/adapter';
import { buildSystemPrompt } from '../../prompts/promptBuilder';
import { PersonaId } from '../../prompts/types';
import { MODEL_GROUPS } from '../../models';
import { Bindings } from '../../types';

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatInput {
  messages: ChatMessagePayload[];
  modelName?: string;
  providerSlug?: string;
  personaId?: PersonaId;
}

export class ChatService {
  async handleStreamChat(c: Context<{ Bindings: Bindings }>, input: StreamChatInput) {
    const environment = env<{ CLOUDFLARE_ACCOUNT_ID?: string; CLOUDFLARE_API_TOKEN?: string; CLOUDFLARE_GATEWAY_ID?: string }>(c);
    const accountId = environment.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = environment.CLOUDFLARE_API_TOKEN;
    const gatewayId = environment.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';

    console.log('[Hono Server] Account ID:', accountId ? 'FOUND' : 'MISSING', 'API Token:', apiToken ? 'FOUND' : 'MISSING');

    if (!accountId || !apiToken) {
      console.error('[Hono Server Error] Missing Cloudflare API credentials in c.env!');
      return c.json(
        {
          error:
            'Missing Cloudflare API credentials. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in server configuration or .dev.vars file.',
        },
        500
      );
    }

    const selectedModel = input.modelName || 'deepseek-ai/deepseek-v4-pro';
    const allModels = MODEL_GROUPS.flatMap((group) => group.models);
    const foundModel = allModels.find((m) => m.id === selectedModel);
    const resolvedProviderSlug = input.providerSlug || foundModel?.providerSlug || 'custom-nvidia';

    console.log('[Hono Server] Incoming chat request:', { selectedModel, resolvedProviderSlug, messageCount: input.messages.length });

    const systemPrompt = buildSystemPrompt({ personaId: input.personaId });
    const sanitizedMessages = input.messages
      .filter((msg) => msg.content && msg.content.trim().length > 0)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...sanitizedMessages,
    ];

    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${resolvedProviderSlug}/v1/chat/completions`;
    console.log('[Hono Server] Dispatching to Gateway URL:', gatewayUrl);

    try {
      const fetchResponse = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-aig-authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesPayload,
          stream: true,
        }),
      });

      if (!fetchResponse.ok || !fetchResponse.body) {
        const errorText = await fetchResponse.text().catch(() => 'Unknown gateway error');
        console.error(`[Cloudflare AI Gateway Error Response]: Status ${fetchResponse.status} - ${errorText}`);
        return c.json(
          {
            error: `Cloudflare AI Gateway request failed [${fetchResponse.status}]: ${errorText}`,
          },
          fetchResponse.status as any
        );
      }

      const encoder = new TextEncoder();
      const upstreamReader = fetchResponse.body.getReader();
      const decoder = new TextDecoder();

      const readable = new ReadableStream({
        async pull(controller) {
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await upstreamReader.read();
              if (done) {
                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (!trimmed.startsWith('data:')) continue;
                if (trimmed === 'data: [DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const jsonStr = trimmed.slice(5).trim();
                  if (!jsonStr) continue;
                  const parsed = JSON.parse(jsonStr);

                  const delta = parsed.choices?.[0]?.delta;
                  const contentChunk = delta?.content || parsed.response || parsed.result?.response;
                  const reasoningChunk = delta?.reasoning_content || delta?.reasoning;

                  if (reasoningChunk) {
                    const payload = JSON.stringify({ choices: [{ delta: { reasoning_content: reasoningChunk } }] });
                    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                  }
                  if (contentChunk) {
                    const payload = JSON.stringify({ choices: [{ delta: { content: contentChunk } }] });
                    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                  }
                } catch {
                }
              }
            }
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Stream error occurred';
            console.error('[Hono Stream Exception]:', err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
            controller.close();
          }
        },
        cancel() {
          upstreamReader.cancel();
        },
      });

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Fetch error occurred';
      console.error('[Hono Fetch Exception]:', err);
      return c.json({ error: `Hono Fetch Exception: ${errorMsg}` }, 500);
    }
  }
}

export const chatService = new ChatService();
