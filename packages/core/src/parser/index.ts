import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scanFiles } from './scanner';
import { parseAnnotations } from './annotation';
import { detectFramework } from './framework-detect';
import type { ParsedAnnotation, ValidationIssue, Framework } from '../types';

export interface ParseResult {
  framework: Framework;
  language: string;
  annotations: ParsedAnnotation[];
  entrypoints: string[];
  errors: ValidationIssue[];
}

export async function parse(root: string): Promise<ParseResult> {
  const [detection, files] = await Promise.all([
    detectFramework(root),
    scanFiles(root),
  ]);

  const allAnnotations: ParsedAnnotation[] = [];
  const allErrors: ValidationIssue[] = [];
  const entrypoints: string[] = [];

  await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(join(root, filePath), 'utf-8');
      const { annotations, errors } = parseAnnotations(content, filePath);

      if (annotations.length > 0) {
        entrypoints.push(filePath);
      }

      allAnnotations.push(...annotations);
      allErrors.push(...errors);
    }),
  );

  const idMap = new Map<string, ParsedAnnotation>();
  for (const annotation of allAnnotations) {
    const existing = idMap.get(annotation.id);
    if (existing && existing.source.file !== annotation.source.file) {
      allErrors.push({
        code: 'E003',
        severity: 'error',
        message: `Duplicate annotation ID "${annotation.id}" across files: ${existing.source.file} and ${annotation.source.file}`,
        annotationId: annotation.id,
        file: annotation.source.file,
        line: annotation.source.startLine,
      });
    }
    idMap.set(annotation.id, annotation);
  }

  return {
    framework: detection.framework,
    language: detection.language,
    annotations: allAnnotations,
    entrypoints: entrypoints.sort(),
    errors: allErrors,
  };
}

export { scanFiles } from './scanner';
export { parseAnnotations } from './annotation';
export { detectFramework } from './framework-detect';
