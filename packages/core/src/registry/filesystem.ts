import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { KintsugiRegistry } from './interface';
import type { Author, Revision, AnnotationValue, RegistrySnapshot } from '../types';

export class FilesystemRegistry implements KintsugiRegistry {
  private root: string;
  private statePath: string;
  private revisionsDir: string;
  private state: Record<string, AnnotationValue> = {};

  constructor(root: string) {
    this.root = root;
    this.statePath = join(root, 'state.json');
    this.revisionsDir = join(root, 'revisions');
  }

  async init(): Promise<void> {
    await mkdir(this.revisionsDir, { recursive: true });
    try {
      const content = await readFile(this.statePath, 'utf-8');
      this.state = JSON.parse(content);
    } catch {
      this.state = {};
      await this.saveState();
    }
  }

  async get(id: string): Promise<AnnotationValue | null> {
    return this.state[id] ?? null;
  }

  async set(id: string, value: unknown, author: Author): Promise<string> {
    const revisionId = `rev_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const oldValue = this.state[id]?.value ?? null;

    const revision: Revision = {
      revisionId, annotationId: id, oldValue, newValue: value, author, timestamp: now,
    };

    const annRevDir = join(this.revisionsDir, id);
    await mkdir(annRevDir, { recursive: true });
    await writeFile(join(annRevDir, `${revisionId}.json`), JSON.stringify(revision, null, 2));

    this.state[id] = { id, value, updatedAt: now, updatedBy: author };
    await this.saveState();
    return revisionId;
  }

  async getHistory(id: string, limit?: number): Promise<Revision[]> {
    const annRevDir = join(this.revisionsDir, id);
    let files: string[];
    try {
      files = await readdir(annRevDir);
    } catch {
      return [];
    }

    const revisions: Revision[] = [];
    for (const file of files.sort()) {
      const content = await readFile(join(annRevDir, file), 'utf-8');
      revisions.push(JSON.parse(content));
    }

    revisions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    if (limit !== undefined) return revisions.slice(-limit);
    return revisions;
  }

  async rollback(id: string, revisionId: string): Promise<AnnotationValue> {
    const history = await this.getHistory(id);
    const target = history.find(r => r.revisionId === revisionId);
    if (!target) throw new Error(`Revision "${revisionId}" not found for "${id}"`);

    const now = new Date().toISOString();
    const rollbackAuthor: Author = { type: 'system', id: 'rollback' };
    const rollbackRev: Revision = {
      revisionId: `rev_${randomUUID().slice(0, 8)}`,
      annotationId: id,
      oldValue: this.state[id]?.value ?? null,
      newValue: target.newValue,
      author: rollbackAuthor,
      timestamp: now,
    };

    const annRevDir = join(this.revisionsDir, id);
    await writeFile(join(annRevDir, `${rollbackRev.revisionId}.json`), JSON.stringify(rollbackRev, null, 2));

    const restored: AnnotationValue = { id, value: target.newValue, updatedAt: now, updatedBy: rollbackAuthor };
    this.state[id] = restored;
    await this.saveState();
    return restored;
  }

  async listAll(): Promise<Record<string, AnnotationValue>> {
    return { ...this.state };
  }

  async export(): Promise<RegistrySnapshot> {
    const revisions: Record<string, Revision[]> = {};
    let dirs: string[];
    try {
      dirs = await readdir(this.revisionsDir);
    } catch {
      dirs = [];
    }
    for (const dir of dirs) revisions[dir] = await this.getHistory(dir);
    return { exportedAt: new Date().toISOString(), annotations: { ...this.state }, revisions };
  }

  async import(snapshot: RegistrySnapshot): Promise<void> {
    this.state = {};
    try { await rm(this.revisionsDir, { recursive: true, force: true }); } catch { /* empty */ }
    await mkdir(this.revisionsDir, { recursive: true });

    for (const [id, value] of Object.entries(snapshot.annotations)) this.state[id] = value;
    await this.saveState();

    for (const [id, revisions] of Object.entries(snapshot.revisions)) {
      const annRevDir = join(this.revisionsDir, id);
      await mkdir(annRevDir, { recursive: true });
      for (const rev of revisions) {
        await writeFile(join(annRevDir, `${rev.revisionId}.json`), JSON.stringify(rev, null, 2));
      }
    }
  }

  private async saveState(): Promise<void> {
    await writeFile(this.statePath, JSON.stringify(this.state, null, 2));
  }
}
