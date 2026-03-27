import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRegistry } from '../../src/registry/memory';
import type { Author } from '../../src/types';

const humanAuthor: Author = { type: 'human', id: 'user-1', channel: 'web' };
const agentAuthor: Author = { type: 'ai-agent', id: 'claude', model: 'claude-sonnet-4.6' };

describe('MemoryRegistry', () => {
  let registry: MemoryRegistry;

  beforeEach(() => {
    registry = new MemoryRegistry();
  });

  it('get returns null for unknown id', async () => {
    const result = await registry.get('unknown');
    expect(result).toBeNull();
  });

  it('set and get roundtrip', async () => {
    const revId = await registry.set('title', 'Hello World', humanAuthor);
    expect(revId).toBeTruthy();

    const value = await registry.get('title');
    expect(value).not.toBeNull();
    expect(value!.value).toBe('Hello World');
    expect(value!.updatedBy.type).toBe('human');
  });

  it('set returns different revision IDs', async () => {
    const rev1 = await registry.set('title', 'V1', humanAuthor);
    const rev2 = await registry.set('title', 'V2', agentAuthor);
    expect(rev1).not.toBe(rev2);
  });

  it('getHistory returns revisions in order', async () => {
    await registry.set('title', 'V1', humanAuthor);
    await registry.set('title', 'V2', agentAuthor);
    await registry.set('title', 'V3', humanAuthor);

    const history = await registry.getHistory('title');
    expect(history).toHaveLength(3);
    expect(history[0].newValue).toBe('V1');
    expect(history[2].newValue).toBe('V3');
  });

  it('getHistory respects limit', async () => {
    await registry.set('title', 'V1', humanAuthor);
    await registry.set('title', 'V2', humanAuthor);
    await registry.set('title', 'V3', humanAuthor);

    const history = await registry.getHistory('title', 2);
    expect(history).toHaveLength(2);
  });

  it('rollback restores previous value', async () => {
    const rev1 = await registry.set('title', 'V1', humanAuthor);
    await registry.set('title', 'V2', agentAuthor);

    const rolled = await registry.rollback('title', rev1);
    expect(rolled.value).toBe('V1');

    const current = await registry.get('title');
    expect(current!.value).toBe('V1');
  });

  it('rollback throws for unknown revision', async () => {
    await registry.set('title', 'V1', humanAuthor);
    await expect(registry.rollback('title', 'fake-rev')).rejects.toThrow();
  });

  it('listAll returns all annotations', async () => {
    await registry.set('title', 'Title', humanAuthor);
    await registry.set('subtitle', 'Sub', humanAuthor);

    const all = await registry.listAll();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all['title'].value).toBe('Title');
  });

  it('export and import roundtrip', async () => {
    await registry.set('title', 'Hello', humanAuthor);
    await registry.set('title', 'World', agentAuthor);

    const snapshot = await registry.export();
    expect(snapshot.annotations['title']).toBeDefined();
    expect(snapshot.revisions['title']).toHaveLength(2);

    const newRegistry = new MemoryRegistry();
    await newRegistry.import(snapshot);

    const value = await newRegistry.get('title');
    expect(value!.value).toBe('World');

    const history = await newRegistry.getHistory('title');
    expect(history).toHaveLength(2);
  });
});
