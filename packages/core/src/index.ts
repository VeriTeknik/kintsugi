// @kintsugi/core - AI-native content annotation framework
export const VERSION = '0.1.0';

// Types
export type {
  AnnotationType, CmsMode, Framework, RenderMode, AuthorType,
  AgentMetadata, AnnotationMetadata, ParsedAnnotation, SourceLocation,
  ManifestAnnotation, Manifest, Author, Revision, AnnotationValue,
  RegistrySnapshot, ValidationIssue, ValidationResult,
} from './types';

// Zod schemas
export {
  AnnotationTypeEnum, CmsModeEnum, FrameworkEnum, RenderModeEnum,
  AnnotationMetadataSchema, ManifestSchema, AgentMetadataSchema, AgentBlockSchema,
} from './types';

// Parser
export { parse, scanFiles, parseAnnotations, detectFramework } from './parser';
export type { ParseResult } from './parser';

// Manifest
export { parseManifestFile, serializeManifest } from './manifest/schema';
export { generateManifest } from './manifest/generator';
export { mergeManifest } from './manifest/merge';

// Validator
export { validate } from './validator';

// Registry
export type { KintsugiRegistry } from './registry';
export { MemoryRegistry, FilesystemRegistry } from './registry';
