import { Context } from 'hono';
import { env } from 'hono/adapter';
import { prisma } from '../../db/client';
import { buildSystemPrompt } from '../../prompts/promptBuilder';
import { PersonaId } from '../../prompts/types';
import { MODEL_GROUPS } from '../../models';
import { Bindings } from '../../types';
import { analystEngine } from '../memory/analystEngine';
import { memoryManager } from '../memory/memoryManager';

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatInput {
  messages: ChatMessagePayload[];
  modelName?: string;
  providerSlug?: string;
  personaId?: PersonaId;
  userId?: string;
  courseId?: string;
  conversationId?: string;
}

export class ChatService {
  private conversationMemoryCache = new Map<string, any>();

  private async ensureUserExists(userId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@gohard.local`,
          name: 'Gohard Learner',
        },
      });
    }
  }

  async getUserConversations(userId: string = 'user-default') {
    await this.ensureUserExists(userId);
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      title: conv.title,
      modelId: conv.modelId,
      createdAt: conv.createdAt,
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        reasoningContent: msg.reasoningContent,
        createdAt: msg.createdAt,
      })),
    }));
  }

  async getConversationDetails(conversationId: string, userId: string = 'user-default') {
    if (this.conversationMemoryCache.has(conversationId)) {
      return this.conversationMemoryCache.get(conversationId);
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return null;

    const payload = {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      modelId: conversation.modelId,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        reasoningContent: msg.reasoningContent,
        createdAt: msg.createdAt,
      })),
    };

    this.conversationMemoryCache.set(conversationId, payload);
    return payload;
  }

  async saveConversationMessages(params: {
    conversationId?: string;
    userId?: string;
    modelId?: string;
    title?: string;
    userContent: string;
    assistantContent: string;
  }) {
    const userId = params.userId || 'user-default';
    await this.ensureUserExists(userId);

    const title =
      params.title ||
      (params.userContent.length > 40 ? `${params.userContent.slice(0, 40)}...` : params.userContent) ||
      'New Chat';
    const modelId = params.modelId || 'nvidia/nemotron-3-nano-30b-a3b';

    let conversationId = params.conversationId;
    if (!conversationId) {
      const created = await prisma.conversation.create({
        data: {
          userId,
          title,
          modelId,
        },
      });
      conversationId = created.id;
    } else {
      await prisma.conversation.upsert({
        where: { id: conversationId },
        update: { title, modelId },
        create: {
          id: conversationId,
          userId,
          title,
          modelId,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: params.userContent,
      },
    });

    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: params.assistantContent,
      },
    });

    this.conversationMemoryCache.delete(conversationId);
    return conversationId;
  }

  async deleteConversation(conversationId: string, userId: string = 'user-default') {
    this.conversationMemoryCache.delete(conversationId);
    await prisma.conversation.deleteMany({
      where: { id: conversationId, userId },
    });
    return { success: true };
  }
  async handleStreamChat(c: Context<{ Bindings: Bindings }>, input: StreamChatInput) {
    const environment = env<{ CLOUDFLARE_ACCOUNT_ID?: string; CLOUDFLARE_API_TOKEN?: string; CLOUDFLARE_GATEWAY_ID?: string }>(c);
    const accountId = environment.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = environment.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
    const gatewayId = environment.CLOUDFLARE_GATEWAY_ID || process.env.CLOUDFLARE_GATEWAY_ID || 'ai-engineer';

    console.log('[Hono Server] Account ID:', accountId ? 'FOUND' : 'MISSING', 'API Token:', apiToken ? 'FOUND' : 'MISSING');

    if (!accountId || !apiToken) {
      console.error('[Hono Server Error] Missing Cloudflare API credentials in environment!');
      return c.json(
        {
          error:
            'Missing Cloudflare API credentials. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in server configuration or .env file.',
        },
        500
      );
    }

    const selectedModel = input.modelName || 'deepseek-ai/deepseek-v4-pro';
    const allModels = MODEL_GROUPS.flatMap((group) => group.models);
    const foundModel = allModels.find((m) => m.id === selectedModel);
    const resolvedProviderSlug = input.providerSlug || foundModel?.providerSlug || 'custom-nvidia';

    console.log('[Hono Server] Incoming chat request:', { selectedModel, resolvedProviderSlug, messageCount: input.messages.length });

    const lastUserMessage = input.messages.filter((m) => m.role === 'user').pop()?.content || '';
    const userId = input.userId || 'user-default';
    const courseId = input.courseId;

    let memoryContext = '';
    try {
      memoryContext = await memoryManager.buildMemoryContext({
        userId,
        courseId,
        query: lastUserMessage,
      });
    } catch (err) {
      console.warn('[Hono Server] Failed to build memory context, falling back to empty context:', err);
    }

    const systemPrompt = buildSystemPrompt({
      personaId: input.personaId,
      memoryContext: memoryContext || undefined,
    });
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

      const lastUserMessage = input.messages.filter((m) => m.role === 'user').pop()?.content || '';
      const userId = input.userId || 'user-default';
      const courseId = input.courseId;
      let accumulatedAssistantText = '';

      const triggerBackgroundMemoryExtraction = () => {
        if (!lastUserMessage || !accumulatedAssistantText) return;

        this.saveConversationMessages({
          conversationId: input.conversationId,
          userId,
          modelId: selectedModel,
          userContent: lastUserMessage,
          assistantContent: accumulatedAssistantText,
        }).catch((err) => console.error('[Hono Server] Error persisting conversation messages:', err));

        analystEngine
          .extractAndApplyMemory({
            userId,
            courseId,
            userMessage: lastUserMessage,
            assistantResponse: accumulatedAssistantText,
            modelName: selectedModel,
            providerSlug: resolvedProviderSlug,
          })
          .catch((err) => console.error('[Hono Server] Background memory analysis error:', err));
      };

      const readable = new ReadableStream({
        async pull(controller) {
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await upstreamReader.read();
              if (done) {
                controller.close();
                triggerBackgroundMemoryExtraction();
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
                  triggerBackgroundMemoryExtraction();
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
                    accumulatedAssistantText += contentChunk;
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
