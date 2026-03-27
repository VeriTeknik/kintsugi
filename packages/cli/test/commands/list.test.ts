import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initProject } from '../../src/commands/init.js';
import { listAnnotations } from '../../src/commands/list.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, '../../../core/test/fixtures');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-list-'));
  await cp(join(FIXTURES, 'html-project'), join(tmpDir, 'html-project'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('listAnnotations', () => {
  it('returns all annotations with no filter', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'list-test');

    const entries = await listAnnotations(root);
    expect(entries).toHaveLength(4);
  });

  it('filter by type returns only matching annotations', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'list-type-test');

    const entries = await listAnnotations(root, { type: 'text' });
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('page-title');
    expect(entries[0].annotation.type).toBe('text');
  });

  it('filter by cms returns only matching annotations', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'list-cms-test');

    const entries = await listAnnotations(root, { cms: 'human-only' });
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('theme');
  });

  it('filter by cms editable returns 3 annotations', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'list-editable-test');

    const entries = await listAnnotations(root, { cms: 'editable' });
    expect(entries).toHaveLength(3);
  });

  it('filter by tag returns empty when no annotations have that tag', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'list-tag-test');

    const entries = await listAnnotations(root, { tag: 'nonexistent-tag' });
    expect(entries).toHaveLength(0);
  });

  it('throws if manifest file does not exist', async () => {
    const root = join(tmpDir, 'html-project');
    await expect(listAnnotations(root)).rejects.toThrow();
  });
});
