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
  personaId: z.enum(['default', 'coding_architect', 'concise_executive']).optional(),
});

export class ChatController {
  async handleStreamChat(c: Context<{ Bindings: Bindings }>) {
    const payload = await c.req.json();
    const validated = streamChatSchema.parse(payload);
    return chatService.handleStreamChat(c, validated as any);
  }
}

export const chatController = new ChatController();
