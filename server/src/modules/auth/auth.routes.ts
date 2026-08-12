import { Hono } from 'hono';
import { authController } from './auth.controller';
import { authMiddleware } from './auth.middleware';

export const authRouter = new Hono();

// Public auth endpoints
authRouter.post('/register', (c) => authController.register(c));
authRouter.post('/login', (c) => authController.login(c));

// Protected auth endpoints
authRouter.get('/me', authMiddleware, (c) => authController.getMe(c));
authRouter.put('/profile', authMiddleware, (c) => authController.updateProfile(c));
authRouter.put('/password', authMiddleware, (c) => authController.changePassword(c));
