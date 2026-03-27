import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import {
  parse,
  generateManifest,
  validate,
  MemoryRegistry,
  VERSION,
} from '../src';

const FIXTURES = resolve(__dirname, 'fixtures');

describe('integration: full pipeline', () => {
  it('parse -> generate -> validate -> registry for nextjs project', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'nextjs-project'));
    expect(parseResult.framework).toBe('nextjs');
    expect(parseResult.annotations.length).toBeGreaterThanOrEqual(5);
    expect(parseResult.errors).toHaveLength(0);

    const manifest = generateManifest(parseResult, 'integration-test');
    expect(manifest.version).toBe('0.1.0');
    expect(Object.keys(manifest.annotations).length).toBeGreaterThanOrEqual(5);

    const validation = await validate(manifest, resolve(FIXTURES, 'nextjs-project'));
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.stats.totalAnnotations).toBeGreaterThanOrEqual(5);

    const registry = new MemoryRegistry();
    for (const [id, ann] of Object.entries(manifest.annotations)) {
      await registry.set(id, ann.default ?? '', { type: 'system', id: 'init' });
    }

    const all = await registry.listAll();
    expect(Object.keys(all).length).toBeGreaterThanOrEqual(5);

    const heroTitle = await registry.get('hero-title');
    expect(heroTitle).not.toBeNull();
    expect((heroTitle!.value as string)).toContain('Digital Transformation');
  });

  it('parse -> generate -> validate for html project', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'html-test');
    const validation = await validate(manifest, resolve(FIXTURES, 'html-project'));

    expect(validation.valid).toBe(true);
    expect(validation.stats.totalAnnotations).toBe(4);
    expect(validation.stats.byCms['editable']).toBeGreaterThanOrEqual(3);
  });

  it('exports VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
