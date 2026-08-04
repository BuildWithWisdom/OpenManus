import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chatRouter } from './modules/chat/chat.routes';
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

app.route('/api/chat', chatRouter);

export default app;
