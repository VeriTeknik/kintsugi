import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { parse } from '../../src/parser';
import { generateManifest } from '../../src/manifest/generator';
import { ManifestSchema } from '../../src/types';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('generateManifest', () => {
  it('generates valid manifest from parse result', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'nextjs-project'));
    const manifest = generateManifest(parseResult, 'test-nextjs');

    const validated = ManifestSchema.safeParse(manifest);
    expect(validated.success).toBe(true);

    expect(manifest.version).toBe('0.1.0');
    expect(manifest.project.name).toBe('test-nextjs');
    expect(manifest.project.framework).toBe('nextjs');
    expect(manifest.annotations['hero-title']).toBeDefined();
    expect(manifest.annotations['hero-title'].type).toBe('text');
    expect(manifest.annotations['hero-title'].source.file).toContain('page.tsx');
  });

  it('extracts groups from annotations', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'nextjs-project'));
    const manifest = generateManifest(parseResult, 'test-nextjs');

    expect(manifest.groups).toBeDefined();
    expect(manifest.groups!['pricing-card']).toBeDefined();
    expect(manifest.groups!['pricing-card'].members).toContain('plan-name');
    expect(manifest.groups!['pricing-card'].members).toContain('plan-price');
    expect(manifest.groups!['pricing-card'].repeatable).toBe(true);
  });

  it('preserves agent metadata', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'nextjs-project'));
    const manifest = generateManifest(parseResult, 'test-nextjs');

    const heroTitle = manifest.annotations['hero-title'];
    expect(heroTitle.agent).toBeDefined();
    expect(heroTitle.agent?.intent).toBe('primary-headline');
    expect(heroTitle.agent?.priority).toBe('critical');
  });

  it('generates manifest for HTML project', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test-html');

    expect(manifest.project.framework).toBe('html');
    expect(Object.keys(manifest.annotations)).toHaveLength(4);
  });

  it('sets default renderMode to static', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test-html');

    expect(manifest.project.renderMode).toBe('static');
  });
});
