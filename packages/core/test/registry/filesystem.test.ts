import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FilesystemRegistry } from '../../src/registry/filesystem';
import type { Author } from '../../src/types';

const humanAuthor: Author = { type: 'human', id: 'user-1', channel: 'web' };
const agentAuthor: Author = { type: 'ai-agent', id: 'claude', model: 'claude-sonnet-4.6' };

describe('FilesystemRegistry', () => {
  let tmpDir: string;
  let registry: FilesystemRegistry;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'kintsugi-test-'));
    registry = new FilesystemRegistry(tmpDir);
    await registry.init();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates storage directory structure on init', async () => {
    const entries = await readdir(tmpDir);
    expect(entries).toContain('state.json');
    expect(entries).toContain('revisions');
  });

  it('set and get roundtrip persists to disk', async () => {
    await registry.set('title', 'Hello World', humanAuthor);

    const registry2 = new FilesystemRegistry(tmpDir);
    await registry2.init();

    const value = await registry2.get('title');
    expect(value).not.toBeNull();
    expect(value!.value).toBe('Hello World');
  });

  it('revision files are created per annotation', async () => {
    await registry.set('title', 'V1', humanAuthor);
    await registry.set('title', 'V2', agentAuthor);

    const revDir = join(tmpDir, 'revisions', 'title');
    const files = await readdir(revDir);
    expect(files).toHaveLength(2);
  });

  it('rollback works across reload', async () => {
    const rev1 = await registry.set('title', 'V1', humanAuthor);
    await registry.set('title', 'V2', agentAuthor);

    const registry2 = new FilesystemRegistry(tmpDir);
    await registry2.init();

    const rolled = await registry2.rollback('title', rev1);
    expect(rolled.value).toBe('V1');
  });

  it('export produces complete snapshot', async () => {
    await registry.set('title', 'Hello', humanAuthor);
    await registry.set('sub', 'World', humanAuthor);

    const snapshot = await registry.export();
    expect(Object.keys(snapshot.annotations)).toHaveLength(2);
    expect(snapshot.revisions['title']).toHaveLength(1);
  });

  it('import restores state from snapshot', async () => {
    await registry.set('title', 'Hello', humanAuthor);
    const snapshot = await registry.export();

    const tmpDir2 = await mkdtemp(join(tmpdir(), 'kintsugi-import-'));
    const registry2 = new FilesystemRegistry(tmpDir2);
    await registry2.init();
    await registry2.import(snapshot);

    const value = await registry2.get('title');
    expect(value!.value).toBe('Hello');

    await rm(tmpDir2, { recursive: true, force: true });
  });
});
