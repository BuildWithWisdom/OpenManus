import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { chatController, streamChatSchema } from './chat.controller';
import { MODEL_GROUPS } from '../../models';
import { Bindings } from '../../types';

export const chatRouter = new Hono<{ Bindings: Bindings }>();

chatRouter.post('/stream', zValidator('json', streamChatSchema), (c) =>
  chatController.handleStreamChat(c)
);

chatRouter.get('/models', (c) => {
  return c.json({ modelGroups: MODEL_GROUPS });
});

chatRouter.get('/conversations', (c) => chatController.handleGetUserConversations(c));

chatRouter.get('/conversations/:id', (c) => chatController.handleGetConversationDetails(c));

chatRouter.delete('/conversations/:id', (c) => chatController.handleDeleteConversation(c));
