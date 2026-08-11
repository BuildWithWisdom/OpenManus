import { Context } from 'hono';
import { z } from 'zod';
import { chatService } from './chat.service';
import { Bindings } from '../../types';

export const streamChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  modelName: z.string().optional(),
  providerSlug: z.string().optional(),
  personaId: z.string().optional(),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  conversationId: z.string().optional(),
});

export class ChatController {
  async handleStreamChat(c: Context<{ Bindings: Bindings }>) {
    const validated = c.req.valid('json' as never) || (await c.req.json());
    return chatService.handleStreamChat(c, validated as any);
  }

  async handleGetUserConversations(c: Context<{ Bindings: Bindings }>) {
    try {
      const userId = c.req.query('userId') || 'user-default';
      const conversations = await chatService.getUserConversations(userId);
      return c.json({ conversations });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch conversations';
      return c.json({ error: msg }, 500);
    }
  }

  async handleGetConversationDetails(c: Context<{ Bindings: Bindings }>) {
    try {
      const conversationId = c.req.param('id');
      const userId = c.req.query('userId') || 'user-default';
      const conversation = await chatService.getConversationDetails(conversationId, userId);
      if (!conversation) {
        return c.json({ error: 'Conversation not found' }, 404);
      }
      return c.json({ conversation });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch conversation';
      return c.json({ error: msg }, 500);
    }
  }

  async handleDeleteConversation(c: Context<{ Bindings: Bindings }>) {
    try {
      const conversationId = c.req.param('id');
      const userId = c.req.query('userId') || 'user-default';
      const result = await chatService.deleteConversation(conversationId, userId);
      return c.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete conversation';
      return c.json({ error: msg }, 500);
    }
  }
}

export const chatController = new ChatController();
