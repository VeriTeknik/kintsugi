import type { Manifest, ManifestAnnotation } from '../types';
import type { ParseResult } from '../parser';

export function generateManifest(
  parseResult: ParseResult,
  projectName: string,
  renderMode: 'runtime' | 'static' = 'static',
): Manifest {
  const annotations: Record<string, ManifestAnnotation> = {};
  const groups: Record<string, {
    label: string;
    members: string[];
    repeatable?: boolean;
    maxInstances?: number;
  }> = {};

  for (const ann of parseResult.annotations) {
    if (ann.metadata.type === 'group') {
      groups[ann.id] = {
        label: ann.metadata.label ?? ann.id,
        members: [],
        repeatable: ann.metadata.repeatable,
        maxInstances: ann.metadata.maxInstances,
      };
    }

    const { repeatable, maxInstances, ...rest } = ann.metadata;

    annotations[ann.id] = {
      ...rest,
      default: ann.content || undefined,
      source: ann.source,
      group: ann.metadata.group ?? null,
      order: ann.metadata.order,
    };
  }

  for (const ann of parseResult.annotations) {
    if (ann.metadata.group && groups[ann.metadata.group]) {
      groups[ann.metadata.group].members.push(ann.id);
    }
  }

  return {
    version: '0.1.0',
    generator: 'kintsugi-cli/0.1.0',
    generatedAt: new Date().toISOString(),
    project: {
      name: projectName,
      framework: parseResult.framework,
      language: parseResult.language,
      entrypoints: parseResult.entrypoints,
      renderMode,
    },
    annotations,
    groups: Object.keys(groups).length > 0 ? groups : undefined,
  };
}
