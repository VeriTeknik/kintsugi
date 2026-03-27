import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { validate } from '../../src/validator';
import { parse } from '../../src/parser';
import { generateManifest } from '../../src/manifest/generator';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('validate', () => {
  it('validates a correct manifest with no errors', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'nextjs-project'));
    const manifest = generateManifest(parseResult, 'test');
    const result = await validate(manifest, resolve(FIXTURES, 'nextjs-project'));

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.totalAnnotations).toBeGreaterThanOrEqual(5);
  });

  it('E001: annotation in manifest but missing from source', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    manifest.annotations['phantom'] = {
      type: 'text',
      cms: 'editable',
      source: { file: 'index.html', startLine: 999, endLine: 999 },
    };

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E001')).toBe(true);
  });

  it('E006: invalid type value', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    (manifest.annotations['page-title'] as any).type = 'invalid';

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E006')).toBe(true);
  });

  it('E007: invalid cms value', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    (manifest.annotations['page-title'] as any).cms = 'writeable';

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E007')).toBe(true);
  });

  it('E009: group references nonexistent member', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    manifest.groups = {
      'fake-group': { label: 'Fake', members: ['nonexistent-member'] },
    };

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E009')).toBe(true);
  });

  it('E011: nested group depth exceeds 2', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    manifest.annotations['outer'] = {
      type: 'group',
      cms: 'editable',
      source: { file: 'index.html', startLine: 1, endLine: 10 },
      group: null,
    };
    manifest.annotations['inner'] = {
      type: 'group',
      cms: 'editable',
      source: { file: 'index.html', startLine: 2, endLine: 9 },
      group: 'outer',
    };
    manifest.groups = {
      outer: { label: 'Outer', members: ['inner'] },
      inner: { label: 'Inner', members: ['page-title'] },
    };
    manifest.annotations['page-title'].group = 'inner';

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E011')).toBe(true);
  });

  it('E012: procedure references nonexistent annotation', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    manifest.agent = {
      description: 'Test',
      procedures: {
        'update': {
          description: 'Update stuff',
          steps: [{ action: 'write', target: 'nonexistent-id' }],
        },
      },
    };

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E012')).toBe(true);
  });

  it('E013: agent.affects references nonexistent annotation', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    manifest.annotations['page-title'].agent = {
      affects: ['nonexistent-annotation'],
    };

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.errors.some(e => e.code === 'E013')).toBe(true);
  });

  it('W001: missing label warning', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    delete (manifest.annotations['page-title'] as any).label;

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.warnings.some(w => w.code === 'W001')).toBe(true);
  });

  it('W003: missing agent metadata warning', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');

    for (const ann of Object.values(manifest.annotations)) {
      delete (ann as any).agent;
    }

    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));
    expect(result.warnings.some(w => w.code === 'W003')).toBe(true);
    expect(result.stats.agentCoverage).toBe(0);
  });

  it('calculates correct stats', async () => {
    const parseResult = await parse(resolve(FIXTURES, 'html-project'));
    const manifest = generateManifest(parseResult, 'test');
    const result = await validate(manifest, resolve(FIXTURES, 'html-project'));

    expect(result.stats.totalAnnotations).toBe(4);
    expect(result.stats.byType['text']).toBeDefined();
    expect(result.stats.byCms['editable']).toBeDefined();
  });
});
