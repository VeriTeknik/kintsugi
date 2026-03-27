import type { AnnotationType, ValidationIssue } from '../types';

export function checkConstraint(
  annotationId: string,
  type: AnnotationType,
  constraints: Record<string, unknown> | undefined,
  content: string,
): ValidationIssue[] {
  if (!constraints) return [];

  const issues: ValidationIssue[] = [];

  const warn = (message: string) => {
    issues.push({
      code: 'W004',
      severity: 'warning',
      message: `Annotation "${annotationId}": ${message}`,
      annotationId,
    });
  };

  switch (type) {
    case 'text': {
      const c = constraints as { maxLength?: number; minLength?: number; pattern?: string };
      const text = stripTags(content).trim();
      if (c.maxLength !== undefined && text.length > c.maxLength) {
        warn(`text length ${text.length} exceeds maxLength ${c.maxLength}`);
      }
      if (c.minLength !== undefined && text.length < c.minLength) {
        warn(`text length ${text.length} below minLength ${c.minLength}`);
      }
      if (c.pattern !== undefined && !new RegExp(c.pattern).test(text)) {
        warn(`text does not match pattern "${c.pattern}"`);
      }
      break;
    }

    case 'richtext': {
      const c = constraints as { maxLength?: number; allowedTags?: string[] };
      if (c.maxLength !== undefined && content.length > c.maxLength) {
        warn(`richtext length ${content.length} exceeds maxLength ${c.maxLength}`);
      }
      if (c.allowedTags) {
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
        let match;
        const disallowed = new Set<string>();
        while ((match = tagRegex.exec(content)) !== null) {
          const tag = match[1].toLowerCase();
          if (!c.allowedTags.includes(tag)) {
            disallowed.add(tag);
          }
        }
        if (disallowed.size > 0) {
          warn(`richtext contains disallowed tags: ${[...disallowed].join(', ')}`);
        }
      }
      break;
    }

    case 'image': {
      const c = constraints as { allowedFormats?: string[] };
      if (c.allowedFormats) {
        const srcMatch = content.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
          const ext = srcMatch[1].split('.').pop()?.toLowerCase();
          if (ext && !c.allowedFormats.includes(ext)) {
            warn(`image format "${ext}" not in allowed: ${c.allowedFormats.join(', ')}`);
          }
        }
      }
      break;
    }
  }

  return issues;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
