import type { MiddlewareHandler } from 'hono';

interface AuthConfig {
  enabled: boolean;
  header: string;
}

export function authMiddleware(config: AuthConfig): MiddlewareHandler {
  return async (c, next) => {
    // Always allow health checks
    if (c.req.path === '/health') return next();

    if (!config.enabled) return next();

    const user = c.req.header(config.header);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('authUser', user);
    return next();
  };
}
