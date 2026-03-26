import { describe, it, expect } from 'vitest';
import {
  AnnotationMetadataSchema,
  ManifestSchema,
} from '../../src/types';

describe('AnnotationMetadataSchema', () => {
  it('parses a valid text annotation', () => {
    const input = {
      type: 'text',
      label: 'Main Title',
      cms: 'editable',
      constraints: { maxLength: 80 },
      agent: { intent: 'primary-headline', priority: 'critical' },
    };
    const result = AnnotationMetadataSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('text');
      expect(result.data.agent?.intent).toBe('primary-headline');
    }
  });

  it('rejects invalid type', () => {
    const input = { type: 'invalid', cms: 'editable' };
    const result = AnnotationMetadataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid cms mode', () => {
    const input = { type: 'text', cms: 'writeable' };
    const result = AnnotationMetadataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('parses group with repeatable', () => {
    const input = {
      type: 'group',
      label: 'Pricing Card',
      cms: 'editable',
      repeatable: true,
      maxInstances: 5,
    };
    const result = AnnotationMetadataSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('parses image with constraints', () => {
    const input = {
      type: 'image',
      label: 'Hero BG',
      cms: 'editable',
      constraints: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxSizeKb: 500,
        allowedFormats: ['jpg', 'webp'],
      },
    };
    const result = AnnotationMetadataSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe('ManifestSchema', () => {
  it('parses a minimal valid manifest', () => {
    const input = {
      version: '0.1.0',
      generator: 'kintsugi-cli/0.1.0',
      generatedAt: '2026-03-27T14:00:00Z',
      project: {
        name: 'test-project',
        framework: 'nextjs',
        language: 'typescript',
        entrypoints: ['src/app/page.tsx'],
        renderMode: 'runtime',
      },
      annotations: {},
    };
    const result = ManifestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
