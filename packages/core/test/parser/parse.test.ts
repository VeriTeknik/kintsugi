import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { parse } from '../../src/parser';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('parse', () => {
  it('parses a full nextjs project', async () => {
    const result = await parse(resolve(FIXTURES, 'nextjs-project'));

    expect(result.framework).toBe('nextjs');
    expect(result.language).toBe('typescript');
    expect(result.annotations.length).toBeGreaterThanOrEqual(5);
    expect(result.errors).toHaveLength(0);

    const heroTitle = result.annotations.find(a => a.id === 'hero-title');
    expect(heroTitle).toBeDefined();
    expect(heroTitle!.metadata.type).toBe('text');
  });

  it('parses a plain HTML project', async () => {
    const result = await parse(resolve(FIXTURES, 'html-project'));

    expect(result.framework).toBe('html');
    expect(result.annotations.length).toBe(4);
    expect(result.errors).toHaveLength(0);
  });

  it('detects entrypoints', async () => {
    const result = await parse(resolve(FIXTURES, 'nextjs-project'));

    expect(result.entrypoints.length).toBeGreaterThan(0);
    expect(result.entrypoints.some(e => e.endsWith('page.tsx'))).toBe(true);
  });
});
