import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from '../helpers';
import type { AppState } from '../../src/server';
import { MemoryRegistry } from '@kintsugi/core';

const AUTHOR = { type: 'ai-agent' as const, id: 'test-agent', channel: 'api' };

async function seedRegistry(registry: MemoryRegistry) {
  await registry.set('hero-title', 'Welcome to our site', AUTHOR);
  await registry.set('hero-bg', '/images/hero.jpg', AUTHOR);
}

describe('GET /annotations', () => {
  it('returns 200 with all annotations', async () => {
    const { app, registry } = createTestApp();
    await seedRegistry(registry as MemoryRegistry);

    const res = await app.request('/annotations');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body)).toHaveLength(4);
  });

  it('filters by type', async () => {
    const { app, registry } = createTestApp();
    await seedRegistry(registry as MemoryRegistry);

    const res = await app.request('/annotations?type=image');
    expect(res.status).toBe(200);
    const body = await res.json();
    // hero-bg and brand-logo are type=image
    expect(Object.keys(body)).toHaveLength(2);
    expect(Object.keys(body)).toContain('hero-bg');
    expect(Object.keys(body)).toContain('brand-logo');
  });

  it('filters by cms', async () => {
    const { app, registry } = createTestApp();
    await seedRegistry(registry as MemoryRegistry);

    const res = await app.request('/annotations?cms=editable');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body)).toHaveLength(2);
    expect(Object.keys(body)).toContain('hero-title');
    expect(Object.keys(body)).toContain('hero-bg');
  });
});

describe('GET /annotations/:id', () => {
  it('returns 404 for unknown id', async () => {
    const { app } = createTestApp();
    const res = await app.request('/annotations/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns annotation value', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'Hello World', AUTHOR);

    const res = await app.request('/annotations/hero-title');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('hero-title');
    expect(body.value).toBe('Hello World');
  });

  it('returns default value when not set', async () => {
    const { app } = createTestApp();
    const res = await app.request('/annotations/hero-title');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('hero-title');
    expect(body.value).toBeNull();
  });
});

describe('PUT /annotations/:id', () => {
  it('returns 404 for unknown id', async () => {
    const { app } = createTestApp();
    const res = await app.request('/annotations/nonexistent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'test', author: AUTHOR }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 403 for locked annotation', async () => {
    // Override manifest with a locked annotation
    const { MemoryRegistry } = await import('@kintsugi/core');
    const registry = new MemoryRegistry();
    const manifest = {
      version: '1',
      generator: '@kintsugi/cli',
      generatedAt: '2026-01-01T00:00:00.000Z',
      project: { name: 'test', framework: 'nextjs' as const, language: 'typescript', entrypoints: [], renderMode: 'static' as const },
      annotations: {
        'locked-field': {
          type: 'text' as const,
          cms: 'locked' as const,
          source: { file: 'src/test.tsx', startLine: 1, endLine: 1 },
        },
      },
    };
    const { createApp } = await import('../../src/server');
    const { loadConfig } = await import('../../src/config');
    const app = createApp({ config: loadConfig(), manifest, registry });

    const res = await app.request('/annotations/locked-field', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'test', author: AUTHOR }),
    });
    expect(res.status).toBe(403);
  });

  it('updates annotation and returns revision info', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'Old Value', AUTHOR);

    const res = await app.request('/annotations/hero-title', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'New Value', author: AUTHOR }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revisionId).toBeDefined();
    expect(body.oldValue).toBe('Old Value');
    expect(body.newValue).toBe('New Value');
  });
});

describe('GET /annotations/:id/history', () => {
  it('returns revision history', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'v1', AUTHOR);
    await (registry as MemoryRegistry).set('hero-title', 'v2', AUTHOR);

    const res = await app.request('/annotations/hero-title/history');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it('respects limit query', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'v1', AUTHOR);
    await (registry as MemoryRegistry).set('hero-title', 'v2', AUTHOR);
    await (registry as MemoryRegistry).set('hero-title', 'v3', AUTHOR);

    const res = await app.request('/annotations/hero-title/history?limit=2');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe('POST /annotations/:id/rollback', () => {
  it('returns 400 when revisionId missing', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'v1', AUTHOR);

    const res = await app.request('/annotations/hero-title/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('rolls back to previous revision', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'v1', AUTHOR);
    const history1 = await (registry as MemoryRegistry).getHistory('hero-title');
    const revisionId = history1[0].revisionId;

    await (registry as MemoryRegistry).set('hero-title', 'v2', AUTHOR);

    const res = await app.request('/annotations/hero-title/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.value).toBe('v1');
  });

  it('returns 400 for invalid revisionId', async () => {
    const { app, registry } = createTestApp();
    await (registry as MemoryRegistry).set('hero-title', 'v1', AUTHOR);

    const res = await app.request('/annotations/hero-title/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId: 'rev_invalid' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /annotations/batch', () => {
  it('updates multiple annotations', async () => {
    const { app } = createTestApp();

    const res = await app.request('/annotations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: [
          { id: 'hero-title', value: 'Batch Title' },
          { id: 'hero-bg', value: '/images/new.jpg' },
        ],
        author: AUTHOR,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0].id).toBe('hero-title');
    expect(body.results[1].id).toBe('hero-bg');
  });

  it('skips locked annotations in batch', async () => {
    const { MemoryRegistry } = await import('@kintsugi/core');
    const registry = new MemoryRegistry();
    const manifest = {
      version: '1',
      generator: '@kintsugi/cli',
      generatedAt: '2026-01-01T00:00:00.000Z',
      project: { name: 'test', framework: 'nextjs' as const, language: 'typescript', entrypoints: [], renderMode: 'static' as const },
      annotations: {
        'locked-field': { type: 'text' as const, cms: 'locked' as const, source: { file: 'src/test.tsx', startLine: 1, endLine: 1 } },
        'editable-field': { type: 'text' as const, cms: 'editable' as const, source: { file: 'src/test.tsx', startLine: 2, endLine: 2 } },
      },
    };
    const { createApp } = await import('../../src/server');
    const { loadConfig } = await import('../../src/config');
    const app = createApp({ config: loadConfig(), manifest, registry });

    const res = await app.request('/annotations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: [
          { id: 'locked-field', value: 'should-skip' },
          { id: 'editable-field', value: 'should-update' },
        ],
        author: AUTHOR,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].id).toBe('editable-field');
  });

  it('includes procedure in response', async () => {
    const { app } = createTestApp();

    const res = await app.request('/annotations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: [{ id: 'hero-title', value: 'test' }],
        author: AUTHOR,
        procedure: 'homepage-refresh',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.procedure).toBe('homepage-refresh');
  });
});
