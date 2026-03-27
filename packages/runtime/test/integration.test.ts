import { describe, it, expect } from 'vitest';
import { MemoryRegistry } from '@kintsugi/core';
import { createTestApp } from './helpers';

describe('runtime integration', () => {
  it('full flow: health -> briefing -> set -> get -> history -> rollback', async () => {
    const registry = new MemoryRegistry();
    const { app } = createTestApp({ registry: registry as any });

    // 1. Health check
    const health = await app.request('/health');
    expect(health.status).toBe(200);
    expect((await health.json()).status).toBe('ok');

    // 2. Agent briefing
    const briefing = await app.request('/agent/briefing');
    expect(briefing.status).toBe(200);
    const brief = await briefing.json();
    expect(brief.annotations.length).toBeGreaterThan(0);

    // 3. Set annotation
    const putRes = await app.request('/annotations/hero-title', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: 'Version 1',
        author: { type: 'human', id: 'user-1', channel: 'web' },
      }),
    });
    expect(putRes.status).toBe(200);
    const rev1 = (await putRes.json()).revisionId;

    // 4. Update again
    await app.request('/annotations/hero-title', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: 'Version 2',
        author: { type: 'ai-agent', id: 'claude', model: 'claude-sonnet-4.6' },
      }),
    });

    // 5. Get current
    const getRes = await app.request('/annotations/hero-title');
    expect((await getRes.json()).value).toBe('Version 2');

    // 6. History
    const histRes = await app.request('/annotations/hero-title/history');
    expect((await histRes.json()).length).toBe(2);

    // 7. Rollback
    const rollRes = await app.request('/annotations/hero-title/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId: rev1 }),
    });
    expect(rollRes.status).toBe(200);
    expect((await rollRes.json()).value).toBe('Version 1');

    // 8. Export
    const exportRes = await app.request('/export', { method: 'POST' });
    expect(exportRes.status).toBe(200);
    const snapshot = await exportRes.json();
    expect(snapshot.annotations['hero-title']).toBeDefined();
  });

  it('batch update with AI agent author', async () => {
    const registry = new MemoryRegistry();
    await registry.set('hero-title', 'Init', { type: 'system', id: 'init' });
    await registry.set('hero-bg', '/init.webp', { type: 'system', id: 'init' });
    const { app } = createTestApp({ registry: registry as any });

    const res = await app.request('/annotations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: [
          { id: 'hero-title', value: 'AI Updated' },
          { id: 'hero-bg', value: '/ai.webp' },
        ],
        author: { type: 'ai-agent', id: 'claude', model: 'claude-sonnet-4.6' },
        procedure: 'seasonal-refresh',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.procedure).toBe('seasonal-refresh');
  });
});
