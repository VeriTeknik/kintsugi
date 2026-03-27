import { describe, it, expect } from 'vitest';
import { createTestApp, TEST_MANIFEST } from '../helpers';

describe('GET /manifest', () => {
  it('returns 200', async () => {
    const { app } = createTestApp();
    const res = await app.request('/manifest');
    expect(res.status).toBe(200);
  });

  it('returns the full manifest', async () => {
    const { app } = createTestApp();
    const res = await app.request('/manifest');
    const body = await res.json();

    expect(body.project.name).toBe('test-project');
    expect(body.version).toBe('1');
    expect(Object.keys(body.annotations)).toHaveLength(4);
  });

  it('includes all annotation ids', async () => {
    const { app } = createTestApp();
    const res = await app.request('/manifest');
    const body = await res.json();

    const ids = Object.keys(body.annotations);
    expect(ids).toContain('hero-title');
    expect(ids).toContain('hero-bg');
    expect(ids).toContain('analytics');
    expect(ids).toContain('brand-logo');
  });
});
