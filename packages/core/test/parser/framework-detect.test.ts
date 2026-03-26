import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { detectFramework } from '../../src/parser/framework-detect';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('detectFramework', () => {
  it('detects Next.js', async () => {
    const result = await detectFramework(resolve(FIXTURES, 'nextjs-project'));
    expect(result.framework).toBe('nextjs');
    expect(result.language).toBe('typescript');
  });

  it('detects Astro', async () => {
    const result = await detectFramework(resolve(FIXTURES, 'astro-project'));
    expect(result.framework).toBe('astro');
  });

  it('detects plain HTML (no package.json)', async () => {
    const result = await detectFramework(resolve(FIXTURES, 'html-project'));
    expect(result.framework).toBe('html');
    expect(result.language).toBe('html');
  });

  it('detects Python', async () => {
    const result = await detectFramework(resolve(FIXTURES, 'python-project'));
    expect(result.framework).toBe('python');
    expect(result.language).toBe('python');
  });
});
