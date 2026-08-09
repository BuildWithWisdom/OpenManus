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
});

export class ChatController {
  async handleStreamChat(c: Context<{ Bindings: Bindings }>) {
    const validated = c.req.valid('json' as never) || (await c.req.json());
    return chatService.handleStreamChat(c, validated as any);
  }
}

export const chatController = new ChatController();
