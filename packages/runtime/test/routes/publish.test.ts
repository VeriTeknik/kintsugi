import { describe, it, expect } from 'vitest';
import { createTestApp } from '../helpers';
import type { RuntimeConfig } from '../../src/config';

describe('POST /preview', () => {
  it('returns 200', async () => {
    const { app } = createTestApp();
    const res = await app.request('/preview', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('returns current registry state', async () => {
    const { app, registry } = createTestApp();
    await registry.set('hero-title', 'Preview Title', { type: 'human', id: 'test' });

    const res = await app.request('/preview', { method: 'POST' });
    const body = await res.json();

    expect(body.mode).toBe('preview');
    expect(body.project).toBe('test-project');
    expect(body.annotations).toBeDefined();
    expect(body.annotations['hero-title'].value).toBe('Preview Title');
  });
});

describe('POST /publish', () => {
  it('returns 200', async () => {
    const { app } = createTestApp();
    const res = await app.request('/publish', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('returns pending for static mode', async () => {
    const { app } = createTestApp();
    const res = await app.request('/publish', { method: 'POST' });
    const body = await res.json();

    expect(body.status).toBe('pending');
    expect(body.mode).toBe('static');
    expect(typeof body.message).toBe('string');
  });

  it('returns published for runtime mode', async () => {
    const { app } = createTestApp({
      config: {
        port: 4100,
        manifestPath: '/app/kintsugi.json',
        storagePath: '/tmp/kintsugi-test',
        renderMode: 'runtime',
        authEnabled: false,
        authHeader: 'x-forwarded-user',
      } satisfies RuntimeConfig,
    });

    const res = await app.request('/publish', { method: 'POST' });
    const body = await res.json();

    expect(body.status).toBe('published');
    expect(body.mode).toBe('runtime');
  });
});

describe('POST /export', () => {
  it('returns registry snapshot', async () => {
    const { app, registry } = createTestApp();
    await registry.set('hero-title', 'Export Test', { type: 'human', id: 'test' });

    const res = await app.request('/export', { method: 'POST' });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.exportedAt).toBeDefined();
    expect(body.annotations).toBeDefined();
    expect(body.revisions).toBeDefined();
    expect(body.annotations['hero-title'].value).toBe('Export Test');
  });
});

describe('POST /import', () => {
  it('imports registry snapshot', async () => {
    const { app } = createTestApp();

    const snapshot = {
      exportedAt: new Date().toISOString(),
      annotations: {
        'hero-title': {
          id: 'hero-title',
          value: 'Imported Title',
          updatedAt: new Date().toISOString(),
          updatedBy: { type: 'system' as const },
        },
      },
      revisions: {},
    };

    const importRes = await app.request('/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    expect(importRes.status).toBe(200);
    const importBody = await importRes.json();
    expect(importBody.status).toBe('imported');
    expect(importBody.annotationCount).toBe(1);

    // Verify the value was imported
    const getRes = await app.request('/annotations/hero-title');
    const getBody = await getRes.json();
    expect(getBody.value).toBe('Imported Title');
  });
});
