import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initProject } from '../../src/commands/init.js';
import { validateProject } from '../../src/commands/validate.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, '../../../core/test/fixtures');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-validate-'));
  await cp(join(FIXTURES, 'html-project'), join(tmpDir, 'html-project'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('validateProject', () => {
  it('valid project passes', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'validate-test');

    const result = await validateProject(root);
    expect(result.valid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('reports correct annotation stats', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'stats-test');

    const result = await validateProject(root);
    expect(result.stats.totalAnnotations).toBe(4);
  });

  it('strict mode: project with warnings is invalid', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'strict-test');

    // html-project annotations lack agent metadata (W003) and defaults (W002),
    // so strict mode treats these warnings as errors → valid is false
    const result = await validateProject(root, true);
    expect(result.valid).toBe(false);
    expect(result.warningCount).toBeGreaterThan(0);
  });

  it('throws if manifest file does not exist', async () => {
    const root = join(tmpDir, 'html-project');
    // no init — no kintsugi.json
    await expect(validateProject(root)).rejects.toThrow();
  });
});
