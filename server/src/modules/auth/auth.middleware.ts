import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'openmanus_jwt_secret_key_2026_super_secure';

export interface JwtUserPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return c.json({ error: 'Unauthorized: Empty token' }, 401);
  }

  try {
    const payload = (await verify(token, JWT_SECRET, 'HS256')) as unknown as JwtUserPayload;
    if (!payload || !payload.id) {
      return c.json({ error: 'Unauthorized: Invalid token payload' }, 401);
    }
    c.set('user', payload);
    await next();
  } catch (error: any) {
    console.error('[Auth Middleware] Verification failed:', error?.message || error);
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const payload = (await verify(token, JWT_SECRET, 'HS256')) as unknown as JwtUserPayload;
        if (payload && payload.id) {
          c.set('user', payload);
        }
      } catch {
        // Soft fail for optional auth
      }
    }
  }
  await next();
}
