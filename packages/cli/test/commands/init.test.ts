import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initProject } from '../../src/commands/init.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, '../../../core/test/fixtures');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-init-'));
  await cp(join(FIXTURES, 'html-project'), join(tmpDir, 'html-project'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('initProject', () => {
  it('creates kintsugi.json and .kintsugirc.json', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await initProject(root, 'test-project');

    expect(result.manifestPath).toBe(join(root, 'kintsugi.json'));
    expect(result.rcPath).toBe(join(root, '.kintsugirc.json'));
    expect(result.annotationCount).toBe(4);
    expect(result.framework).toBe('html');
  });

  it('kintsugi.json is valid JSON with correct project name', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'my-test-site');

    const content = await readFile(join(root, 'kintsugi.json'), 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.project.name).toBe('my-test-site');
    expect(manifest.version).toBe('0.1.0');
    expect(Object.keys(manifest.annotations)).toHaveLength(4);
  });

  it('.kintsugirc.json has expected shape', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'rc-test');

    const content = await readFile(join(root, '.kintsugirc.json'), 'utf-8');
    const rc = JSON.parse(content);

    expect(rc.manifest).toBe('kintsugi.json');
    expect(rc.storage.backend).toBe('filesystem');
  });

  it('detects all 4 html-project annotations', async () => {
    const root = join(tmpDir, 'html-project');
    const result = await initProject(root, 'count-test');
    expect(result.annotationCount).toBe(4);
  });
});
