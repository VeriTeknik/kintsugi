import type { Manifest } from '../types';

/**
 * Merge a freshly-parsed manifest with an existing one.
 * Strategy: fresh scan is source of truth for annotations.
 * Agent block, storage, audit preserved from existing.
 */
export function mergeManifest(existing: Manifest, fresh: Manifest): Manifest {
  return {
    version: fresh.version,
    generator: fresh.generator,
    generatedAt: fresh.generatedAt,
    project: fresh.project,
    agent: fresh.agent ?? existing.agent,
    annotations: fresh.annotations,
    groups: fresh.groups ?? existing.groups,
    components: fresh.components ?? existing.components,
    storage: existing.storage ?? fresh.storage,
    audit: existing.audit ?? fresh.audit,
  };
}
