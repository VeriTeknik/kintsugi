import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../src/middleware/auth';

describe('authMiddleware', () => {
  it('passes when auth disabled', async () => {
    const app = new Hono();
    app.use('*', authMiddleware({ enabled: false, header: 'x-forwarded-user' }));
    app.get('/test', (c) => c.json({ ok: true }));
    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('blocks when auth enabled and no header', async () => {
    const app = new Hono();
    app.use('*', authMiddleware({ enabled: true, header: 'x-forwarded-user' }));
    app.get('/test', (c) => c.json({ ok: true }));
    const res = await app.request('/test');
    expect(res.status).toBe(401);
  });

  it('passes when auth enabled and header present', async () => {
    const app = new Hono();
    app.use('*', authMiddleware({ enabled: true, header: 'x-forwarded-user' }));
    app.get('/test', (c) => c.json({ ok: true }));
    const res = await app.request('/test', {
      headers: { 'x-forwarded-user': 'user@example.com' },
    });
    expect(res.status).toBe(200);
  });

  it('always allows /health', async () => {
    const app = new Hono();
    app.use('*', authMiddleware({ enabled: true, header: 'x-forwarded-user' }));
    app.get('/health', (c) => c.json({ ok: true }));
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });
});
