import { randomUUID } from 'node:crypto';
import type { KintsugiRegistry } from './interface';
import type { Author, Revision, AnnotationValue, RegistrySnapshot } from '../types';

export class MemoryRegistry implements KintsugiRegistry {
  private values = new Map<string, AnnotationValue>();
  private revisions = new Map<string, Revision[]>();

  async get(id: string): Promise<AnnotationValue | null> {
    return this.values.get(id) ?? null;
  }

  async set(id: string, value: unknown, author: Author): Promise<string> {
    const revisionId = `rev_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const oldValue = this.values.get(id)?.value ?? null;

    const revision: Revision = {
      revisionId, annotationId: id, oldValue, newValue: value, author, timestamp: now,
    };

    const history = this.revisions.get(id) ?? [];
    history.push(revision);
    this.revisions.set(id, history);

    this.values.set(id, { id, value, updatedAt: now, updatedBy: author });
    return revisionId;
  }

  async getHistory(id: string, limit?: number): Promise<Revision[]> {
    const history = this.revisions.get(id) ?? [];
    if (limit !== undefined) return history.slice(-limit);
    return history;
  }

  async rollback(id: string, revisionId: string): Promise<AnnotationValue> {
    const history = this.revisions.get(id);
    if (!history) throw new Error(`No history for annotation "${id}"`);

    const target = history.find(r => r.revisionId === revisionId);
    if (!target) throw new Error(`Revision "${revisionId}" not found for "${id}"`);

    const now = new Date().toISOString();
    history.push({
      revisionId: `rev_${randomUUID().slice(0, 8)}`,
      annotationId: id,
      oldValue: this.values.get(id)?.value ?? null,
      newValue: target.newValue,
      author: { type: 'system', id: 'rollback' },
      timestamp: now,
    });

    const restored: AnnotationValue = {
      id, value: target.newValue, updatedAt: now, updatedBy: { type: 'system', id: 'rollback' },
    };
    this.values.set(id, restored);
    return restored;
  }

  async listAll(): Promise<Record<string, AnnotationValue>> {
    const result: Record<string, AnnotationValue> = {};
    for (const [id, value] of this.values) result[id] = value;
    return result;
  }

  async export(): Promise<RegistrySnapshot> {
    const annotations: Record<string, AnnotationValue> = {};
    const revisions: Record<string, Revision[]> = {};
    for (const [id, value] of this.values) annotations[id] = value;
    for (const [id, history] of this.revisions) revisions[id] = [...history];
    return { exportedAt: new Date().toISOString(), annotations, revisions };
  }

  async import(snapshot: RegistrySnapshot): Promise<void> {
    this.values.clear();
    this.revisions.clear();
    for (const [id, value] of Object.entries(snapshot.annotations)) this.values.set(id, value);
    for (const [id, history] of Object.entries(snapshot.revisions)) this.revisions.set(id, [...history]);
  }
}
