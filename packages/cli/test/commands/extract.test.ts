import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAnnotations } from '../../src/commands/extract.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, '../../../core/test/fixtures');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-extract-'));
  await cp(join(FIXTURES, 'html-project'), join(tmpDir, 'html-project'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('extractAnnotations', () => {
  it('json format returns correct annotation count', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await extractAnnotations(root, 'json');

    expect(result.format).toBe('json');
    expect(result.annotationCount).toBe(4);
    expect(result.annotations).toHaveLength(4);
  });

  it('json format includes annotation ids', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await extractAnnotations(root, 'json');

    const ids = result.annotations!.map(a => a.id);
    expect(ids).toContain('page-title');
    expect(ids).toContain('about');
    expect(ids).toContain('theme');
    expect(ids).toContain('team');
  });

  it('manifest format writes kintsugi.json', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await extractAnnotations(root, 'manifest');

    expect(result.format).toBe('manifest');
    expect(result.manifestPath).toBe(join(root, 'kintsugi.json'));
    expect(result.annotationCount).toBe(4);

    const content = await readFile(join(root, 'kintsugi.json'), 'utf-8');
    const manifest = JSON.parse(content);
    expect(Object.keys(manifest.annotations)).toHaveLength(4);
  });

  it('manifest format merges with existing manifest preserving agent block', async () => {
    const root = join(tmpDir, 'html-project');

    // First extract to create manifest
    await extractAnnotations(root, 'manifest');

    // Manually add agent block to existing manifest
    const manifestPath = join(root, 'kintsugi.json');
    const existing = JSON.parse(await readFile(manifestPath, 'utf-8'));
    existing.agent = { description: 'test-agent', rules: ['rule1'] };
    const { writeFile } = await import('node:fs/promises');
    await writeFile(manifestPath, JSON.stringify(existing, null, 2));

    // Re-extract — agent block should be preserved
    await extractAnnotations(root, 'manifest');
    const updated = JSON.parse(await readFile(manifestPath, 'utf-8'));
    expect(updated.agent?.description).toBe('test-agent');
  });

  it('defaults to json format', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await extractAnnotations(root);
    expect(result.format).toBe('json');
  });
});
