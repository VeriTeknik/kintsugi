import type { Author, Revision, AnnotationValue, RegistrySnapshot } from '../types';

export interface KintsugiRegistry {
  get(id: string): Promise<AnnotationValue | null>;
  set(id: string, value: unknown, author: Author): Promise<string>;
  getHistory(id: string, limit?: number): Promise<Revision[]>;
  rollback(id: string, revisionId: string): Promise<AnnotationValue>;
  listAll(): Promise<Record<string, AnnotationValue>>;
  export(): Promise<RegistrySnapshot>;
  import(snapshot: RegistrySnapshot): Promise<void>;
}
