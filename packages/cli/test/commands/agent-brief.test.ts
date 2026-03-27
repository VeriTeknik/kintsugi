import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initProject } from '../../src/commands/init.js';
import { generateBriefing } from '../../src/commands/agent-brief.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, '../../../core/test/fixtures');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-brief-'));
  await cp(join(FIXTURES, 'html-project'), join(tmpDir, 'html-project'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('generateBriefing', () => {
  it('briefing has correct project name', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'brief-project');

    const briefing = await generateBriefing(root);
    expect(briefing.project).toBe('brief-project');
  });

  it('briefing has correct annotation count', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'brief-count');

    const briefing = await generateBriefing(root);
    expect(briefing.annotationCount).toBe(4);
  });

  it('briefing stats are correct', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'brief-stats');

    const briefing = await generateBriefing(root);
    expect(briefing.stats.total).toBe(4);
    expect(briefing.stats.editable).toBe(3);
    expect(briefing.stats.humanOnly).toBe(1);
    expect(briefing.stats.aiOnly).toBe(0);
    expect(briefing.stats.locked).toBe(0);
  });

  it('briefing includes compact annotations without source/constraints', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'brief-compact');

    const briefing = await generateBriefing(root);
    const annEntry = briefing.annotations['page-title'];

    expect(annEntry).toBeDefined();
    expect(annEntry.type).toBe('text');
    expect(annEntry.cms).toBe('editable');
    expect(annEntry.label).toBe('Page Title');
    // source and constraints should NOT be present for token efficiency
    expect((annEntry as Record<string, unknown>)['source']).toBeUndefined();
    expect((annEntry as Record<string, unknown>)['constraints']).toBeUndefined();
  });

  it('briefing has framework field', async () => {
    const root = join(tmpDir, 'html-project');
    await initProject(root, 'brief-framework');

    const briefing = await generateBriefing(root);
    expect(briefing.framework).toBe('html');
  });

  it('throws if manifest file does not exist', async () => {
    const root = join(tmpDir, 'html-project');
    await expect(generateBriefing(root)).rejects.toThrow();
  });
});
