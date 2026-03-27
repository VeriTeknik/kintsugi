import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAnnotations } from '../parser/annotation';
import { AnnotationTypeEnum, CmsModeEnum } from '../types';
import type { Manifest, ValidationIssue } from '../types';

export async function runRules(
  manifest: Manifest,
  projectRoot: string,
): Promise<{ errors: ValidationIssue[]; warnings: ValidationIssue[] }> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const annotationIds = new Set(Object.keys(manifest.annotations));

  // --- Source Verification (E001) ---
  const fileAnnotations = new Map<string, Set<string>>();
  const files = new Set(
    Object.values(manifest.annotations).map(a => a.source.file),
  );

  for (const file of files) {
    try {
      const content = await readFile(join(projectRoot, file), 'utf-8');
      const { annotations } = parseAnnotations(content, file);
      fileAnnotations.set(file, new Set(annotations.map(a => a.id)));
    } catch {
      // File doesn't exist
    }
  }

  for (const [id, ann] of Object.entries(manifest.annotations)) {
    const fileIds = fileAnnotations.get(ann.source.file);
    if (!fileIds || !fileIds.has(id)) {
      errors.push({
        code: 'E001',
        severity: 'error',
        message: `Annotation "${id}" is in manifest but missing from source file "${ann.source.file}"`,
        annotationId: id,
        file: ann.source.file,
      });
    }
  }

  // --- Type and CMS Validation (E006, E007) ---
  const validTypes = new Set(AnnotationTypeEnum.options);
  const validCms = new Set(CmsModeEnum.options);

  for (const [id, ann] of Object.entries(manifest.annotations)) {
    if (!validTypes.has(ann.type as any)) {
      errors.push({
        code: 'E006',
        severity: 'error',
        message: `Annotation "${id}" has invalid type "${ann.type}"`,
        annotationId: id,
      });
    }
    if (!validCms.has(ann.cms as any)) {
      errors.push({
        code: 'E007',
        severity: 'error',
        message: `Annotation "${id}" has invalid cms mode "${ann.cms}"`,
        annotationId: id,
      });
    }
  }

  // --- Group Validation (E009, E011) ---
  if (manifest.groups) {
    for (const [groupId, group] of Object.entries(manifest.groups)) {
      for (const member of group.members) {
        if (!annotationIds.has(member)) {
          errors.push({
            code: 'E009',
            severity: 'error',
            message: `Group "${groupId}" references nonexistent member "${member}"`,
            annotationId: groupId,
          });
        }
      }
    }

    for (const [id, ann] of Object.entries(manifest.annotations)) {
      if (ann.type === 'group' && ann.group) {
        const parentAnn = manifest.annotations[ann.group];
        if (parentAnn?.type === 'group') {
          errors.push({
            code: 'E011',
            severity: 'error',
            message: `Nested group depth exceeds 2: group "${id}" is inside group "${ann.group}"`,
            annotationId: id,
          });
        }
      }
    }
  }

  // --- Agent Validation (E012, E013) ---
  if (manifest.agent?.procedures) {
    for (const [procName, proc] of Object.entries(manifest.agent.procedures)) {
      for (const step of proc.steps) {
        if (step.target && !annotationIds.has(step.target)) {
          errors.push({
            code: 'E012',
            severity: 'error',
            message: `Procedure "${procName}" references nonexistent annotation "${step.target}"`,
          });
        }
      }
    }
  }

  for (const [id, ann] of Object.entries(manifest.annotations)) {
    if (ann.agent?.affects) {
      for (const ref of ann.agent.affects) {
        if (!annotationIds.has(ref)) {
          errors.push({
            code: 'E013',
            severity: 'error',
            message: `Annotation "${id}" agent.affects references nonexistent "${ref}"`,
            annotationId: id,
          });
        }
      }
    }
  }

  // --- Warnings ---
  for (const [id, ann] of Object.entries(manifest.annotations)) {
    if (!ann.label) {
      warnings.push({
        code: 'W001',
        severity: 'warning',
        message: `Annotation "${id}" has no label`,
        annotationId: id,
      });
    }
    if (ann.default === undefined) {
      warnings.push({
        code: 'W002',
        severity: 'warning',
        message: `Annotation "${id}" has no default value`,
        annotationId: id,
      });
    }
    if (!ann.agent) {
      warnings.push({
        code: 'W003',
        severity: 'warning',
        message: `Annotation "${id}" has no agent metadata`,
        annotationId: id,
      });
    }
  }

  if (manifest.agent?.procedures) {
    for (const [procName, proc] of Object.entries(manifest.agent.procedures)) {
      for (const step of proc.steps) {
        if (!step.description && !step.target && !step.filter) {
          warnings.push({
            code: 'W006',
            severity: 'warning',
            message: `Procedure "${procName}" has a step with no description or target`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}
