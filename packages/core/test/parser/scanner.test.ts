import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { scanFiles } from '../../src/parser/scanner';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('scanFiles', () => {
  it('finds annotatable files in nextjs project', async () => {
    const files = await scanFiles(resolve(FIXTURES, 'nextjs-project'));
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.endsWith('page.tsx'))).toBe(true);
  });

  it('respects .gitignore - excludes node_modules', async () => {
    const files = await scanFiles(resolve(FIXTURES, 'nextjs-project'));
    expect(files.every(f => !f.includes('node_modules'))).toBe(true);
  });

  it('finds HTML files', async () => {
    const files = await scanFiles(resolve(FIXTURES, 'html-project'));
    expect(files.some(f => f.endsWith('.html'))).toBe(true);
  });

  it('finds Astro files', async () => {
    const files = await scanFiles(resolve(FIXTURES, 'astro-project'));
    expect(files.some(f => f.endsWith('.astro'))).toBe(true);
  });

  it('excludes common build dirs even without .gitignore', async () => {
    const files = await scanFiles(resolve(FIXTURES, 'html-project'));
    expect(files.every(f => !f.includes('.git/'))).toBe(true);
    expect(files.every(f => !f.includes('dist/'))).toBe(true);
  });
});
