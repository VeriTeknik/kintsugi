import { describe, it, expect } from 'vitest';
import { mergeManifest } from '../../src/manifest/merge';
import type { Manifest } from '../../src/types';

function makeManifest(annotations: Record<string, any>): Manifest {
  return {
    version: '0.1.0',
    generator: 'kintsugi-cli/0.1.0',
    generatedAt: '2026-03-27T14:00:00Z',
    project: {
      name: 'test',
      framework: 'html',
      language: 'html',
      entrypoints: ['index.html'],
      renderMode: 'static',
    },
    annotations,
  };
}

describe('mergeManifest', () => {
  it('adds new annotations', () => {
    const existing = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 1, endLine: 3 } },
    });
    const fresh = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 1, endLine: 3 } },
      'subtitle': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 5, endLine: 7 } },
    });

    const merged = mergeManifest(existing, fresh);
    expect(Object.keys(merged.annotations)).toHaveLength(2);
    expect(merged.annotations['subtitle']).toBeDefined();
  });

  it('removes annotations no longer in source', () => {
    const existing = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 1, endLine: 3 } },
      'removed': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 5, endLine: 7 } },
    });
    const fresh = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 1, endLine: 3 } },
    });

    const merged = mergeManifest(existing, fresh);
    expect(Object.keys(merged.annotations)).toHaveLength(1);
    expect(merged.annotations['removed']).toBeUndefined();
  });

  it('updates source location for moved annotations', () => {
    const existing = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 1, endLine: 3 } },
    });
    const fresh = makeManifest({
      'title': { type: 'text', cms: 'editable', source: { file: 'a.html', startLine: 10, endLine: 12 } },
    });

    const merged = mergeManifest(existing, fresh);
    expect(merged.annotations['title'].source.startLine).toBe(10);
  });

  it('preserves agent block from existing when fresh has none', () => {
    const existing = {
      ...makeManifest({}),
      agent: { description: 'Existing description', rules: ['Rule 1'] },
    };
    const fresh = makeManifest({});

    const merged = mergeManifest(existing, fresh);
    expect(merged.agent?.description).toBe('Existing description');
  });

  it('updates generatedAt timestamp', () => {
    const existing = makeManifest({});
    const fresh = makeManifest({});
    fresh.generatedAt = '2026-04-01T00:00:00Z';

    const merged = mergeManifest(existing, fresh);
    expect(merged.generatedAt).toBe('2026-04-01T00:00:00Z');
  });
});
