import { AnnotationMetadataSchema, type ParsedAnnotation, type ValidationIssue } from '../types';

export type ParseError = ValidationIssue;

interface ParseResult {
  annotations: ParsedAnnotation[];
  errors: ParseError[];
}

const OPEN_PATTERNS = [
  /<!--\s*kintsugi:(\S+)\s+(\{.*\})\s*-->/,
  /\/\*\s*kintsugi:(\S+)\s+(\{.*\})\s*\*\//,
  /^#\s*kintsugi:(\S+)\s+(\{.*\})/,
];

const CLOSE_PATTERNS = [
  /<!--\s*\/kintsugi:(\S+)\s*-->/,
  /\/\*\s*\/kintsugi:(\S+)\s*\*\//,
  /^#\s*\/kintsugi:(\S+)/,
];

function matchOpen(line: string): { id: string; json: string } | null {
  for (const pattern of OPEN_PATTERNS) {
    const match = line.match(pattern);
    if (match) return { id: match[1], json: match[2] };
  }
  return null;
}

function matchClose(line: string): string | null {
  for (const pattern of CLOSE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseAnnotations(content: string, filePath: string): ParseResult {
  const lines = content.split('\n');
  const annotations: ParsedAnnotation[] = [];
  const errors: ParseError[] = [];
  const seenIds = new Set<string>();

  const stack: Array<{
    id: string;
    jsonStr: string;
    startLine: number;
    contentLines: string[];
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const closeId = matchClose(line);
    if (closeId !== null) {
      const openIdx = stack.findLastIndex(s => s.id === closeId);
      if (openIdx === -1) continue;

      const open = stack.splice(openIdx, 1)[0];

      let metadata;
      try {
        const raw = JSON.parse(open.jsonStr);
        const parsed = AnnotationMetadataSchema.safeParse(raw);
        if (!parsed.success) {
          errors.push({
            code: 'E005',
            severity: 'error',
            message: `Invalid annotation metadata for "${open.id}": ${parsed.error.issues[0]?.message}`,
            file: filePath,
            line: open.startLine,
          });
          continue;
        }
        metadata = parsed.data;
      } catch {
        errors.push({
          code: 'E005',
          severity: 'error',
          message: `JSON parse error for "${open.id}"`,
          file: filePath,
          line: open.startLine,
        });
        continue;
      }

      if (seenIds.has(open.id)) {
        errors.push({
          code: 'E003',
          severity: 'error',
          message: `Duplicate annotation ID "${open.id}"`,
          annotationId: open.id,
          file: filePath,
          line: open.startLine,
        });
        continue;
      }

      seenIds.add(open.id);

      annotations.push({
        id: open.id,
        metadata,
        content: open.contentLines.join('\n').trim(),
        source: {
          file: filePath,
          startLine: open.startLine,
          endLine: lineNum,
        },
      });

      continue;
    }

    const open = matchOpen(line);
    if (open !== null) {
      stack.push({
        id: open.id,
        jsonStr: open.json,
        startLine: lineNum,
        contentLines: [],
      });
      continue;
    }

    for (const entry of stack) {
      entry.contentLines.push(line);
    }
  }

  for (const unclosed of stack) {
    errors.push({
      code: 'E004',
      severity: 'error',
      message: `Unclosed annotation "${unclosed.id}"`,
      annotationId: unclosed.id,
      file: filePath,
      line: unclosed.startLine,
    });
  }

  return { annotations, errors };
}
