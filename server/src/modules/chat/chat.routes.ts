import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { chatController, streamChatSchema } from './chat.controller';
import { MODEL_GROUPS } from '../../models';
import { Bindings } from '../../types';
import { authMiddleware, optionalAuthMiddleware } from '../auth/auth.middleware';

export const chatRouter = new Hono<{ Bindings: Bindings }>();

// Public endpoint for model discovery
chatRouter.get('/models', (c) => {
  return c.json({ modelGroups: MODEL_GROUPS });
});

// Guest-friendly endpoint (uses optionalAuthMiddleware so guests can stream 1 message)
chatRouter.post('/stream', optionalAuthMiddleware, zValidator('json', streamChatSchema), (c) =>
  chatController.handleStreamChat(c)
);

// Protected endpoints requiring authenticated user token
chatRouter.use('*', authMiddleware);

chatRouter.get('/conversations', (c) => chatController.handleGetUserConversations(c));

chatRouter.get('/conversations/:id', (c) => chatController.handleGetConversationDetails(c));

chatRouter.delete('/conversations/:id', (c) => chatController.handleDeleteConversation(c));
