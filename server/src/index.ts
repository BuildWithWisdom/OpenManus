import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { chatRouter } from './modules/chat/chat.routes';
import { courseRouter } from './modules/course/course.routes';
import { authRouter } from './modules/auth/auth.routes';
import { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'OpenManus Web Backend', timestamp: new Date().toISOString() });
});

app.route('/api/auth', authRouter);
app.route('/api/chat', chatRouter);
app.route('/api/courses', courseRouter);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[Hono Node Server] Running on http://localhost:${info.port}`);
});

export default app;
