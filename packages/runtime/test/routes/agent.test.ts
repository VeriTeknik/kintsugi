import { describe, it, expect } from 'vitest';
import { createTestApp } from '../helpers';

describe('GET /agent/briefing', () => {
  it('returns 200', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    expect(res.status).toBe(200);
  });

  it('returns project name', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();
    expect(body.project).toBe('test-project');
  });

  it('includes description and rules', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();

    expect(typeof body.description).toBe('string');
    expect(Array.isArray(body.rules)).toBe(true);
    expect(body.rules.length).toBeGreaterThan(0);
  });

  it('includes capabilities', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();

    expect(body.capabilities).toBeDefined();
    expect(body.capabilities.canModifyContent).toBe(true);
  });

  it('only includes annotations with agent metadata', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();

    // hero-title and hero-bg have agent metadata; analytics and brand-logo do not
    expect(body.annotations).toHaveLength(2);
    const ids = body.annotations.map((a: { id: string }) => a.id);
    expect(ids).toContain('hero-title');
    expect(ids).toContain('hero-bg');
    expect(ids).not.toContain('analytics');
    expect(ids).not.toContain('brand-logo');
  });

  it('includes intent and priority in annotation briefing', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();

    const heroTitle = body.annotations.find((a: { id: string }) => a.id === 'hero-title');
    expect(heroTitle).toBeDefined();
    expect(heroTitle.intent).toBe('primary-headline');
    expect(heroTitle.priority).toBe('critical');
    expect(heroTitle.cms).toBe('editable');
  });

  it('returns correct stats', async () => {
    const { app } = createTestApp();
    const res = await app.request('/agent/briefing');
    const body = await res.json();

    expect(body.stats.total).toBe(4);
    expect(body.stats.editable).toBe(2);
    expect(body.stats.aiOnly).toBe(1);
    expect(body.stats.humanOnly).toBe(1);
    expect(body.stats.locked).toBe(0);
  });
});
