import { Context } from 'hono';
import { z } from 'zod';
import { authService } from './auth.service';
import { JwtUserPayload } from './auth.middleware';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export class AuthController {
  async register(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = registerSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: parsed.error.issues[0]?.message || 'Invalid input parameters' },
          400
        );
      }

      const result = await authService.register(parsed.data);
      return c.json(result, 201);
    } catch (error: any) {
      console.error('\n========================================');
      console.error('❌ [AuthController.register ERROR]:', error);
      console.error('========================================\n');
      return c.json({ error: error?.message || 'Failed to register account' }, 400);
    }
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = loginSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: parsed.error.issues[0]?.message || 'Invalid login parameters' },
          400
        );
      }

      const result = await authService.login(parsed.data);
      return c.json(result, 200);
    } catch (error: any) {
      console.error('\n========================================');
      console.error('❌ [AuthController.login ERROR]:', error);
      console.error('========================================\n');
      return c.json({ error: error?.message || 'Authentication failed' }, 401);
    }
  }

  async getMe(c: Context) {
    try {
      const authUser = c.get('user') as JwtUserPayload;
      if (!authUser || !authUser.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const profile = await authService.getProfile(authUser.id);
      return c.json({ user: profile }, 200);
    } catch (error: any) {
      return c.json({ error: error?.message || 'Failed to fetch user profile' }, 404);
    }
  }

  async updateProfile(c: Context) {
    try {
      const authUser = c.get('user') as JwtUserPayload;
      if (!authUser || !authUser.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const parsed = updateProfileSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: parsed.error.issues[0]?.message || 'Invalid profile data' },
          400
        );
      }

      const result = await authService.updateProfile(authUser.id, parsed.data);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error?.message || 'Failed to update profile' }, 400);
    }
  }

  async changePassword(c: Context) {
    try {
      const authUser = c.get('user') as JwtUserPayload;
      if (!authUser || !authUser.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const parsed = changePasswordSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: parsed.error.issues[0]?.message || 'Invalid password parameters' },
          400
        );
      }

      const result = await authService.changePassword(authUser.id, parsed.data);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error?.message || 'Failed to change password' }, 400);
    }
  }
}

export const authController = new AuthController();
