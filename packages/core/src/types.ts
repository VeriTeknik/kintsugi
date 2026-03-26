import { z } from 'zod';

// --- Enums ---

export const AnnotationTypeEnum = z.enum([
  'text', 'richtext', 'image', 'code', 'slot', 'group', 'style', 'data',
]);
export type AnnotationType = z.infer<typeof AnnotationTypeEnum>;

export const CmsModeEnum = z.enum(['editable', 'locked', 'ai-only', 'human-only']);
export type CmsMode = z.infer<typeof CmsModeEnum>;

export const FrameworkEnum = z.enum([
  'nextjs', 'astro', 'html', 'react', 'vue', 'svelte', 'python', 'unknown',
]);
export type Framework = z.infer<typeof FrameworkEnum>;

export const RenderModeEnum = z.enum(['runtime', 'static']);
export type RenderMode = z.infer<typeof RenderModeEnum>;

export const AuthorTypeEnum = z.enum(['human', 'ai-agent', 'system']);
export type AuthorType = z.infer<typeof AuthorTypeEnum>;

// --- Constraint Schemas ---

export const TextConstraintsSchema = z.object({
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  format: z.enum(['plain', 'email', 'url', 'phone']).optional(),
}).strict().optional();

export const RichTextConstraintsSchema = z.object({
  maxLength: z.number().optional(),
  allowedTags: z.array(z.string()).optional(),
  allowedAttributes: z.record(z.array(z.string())).optional(),
}).strict().optional();

export const ImageConstraintsSchema = z.object({
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
  minWidth: z.number().optional(),
  minHeight: z.number().optional(),
  maxSizeKb: z.number().optional(),
  allowedFormats: z.array(z.enum(['jpg', 'png', 'webp', 'svg', 'gif'])).optional(),
  aspectRatio: z.string().optional(),
}).strict().optional();

export const StyleConstraintsSchema = z.object({
  cssProperties: z.array(z.string()).optional(),
  allowedValues: z.array(z.string()).optional(),
  tailwindClasses: z.array(z.string()).optional(),
}).strict().optional();

export const CodeConstraintsSchema = z.object({
  language: z.string().optional(),
  maxLines: z.number().optional(),
  sandbox: z.boolean().optional(),
}).strict().optional();

export const SlotConstraintsSchema = z.object({
  allowedComponents: z.array(z.string()).optional(),
  maxSlots: z.number().optional(),
}).strict().optional();

export const DataConstraintsSchema = z.object({
  schema: z.record(z.unknown()),
  maxItems: z.number().optional(),
}).strict().optional();

export const ConstraintsSchema = z.union([
  TextConstraintsSchema,
  RichTextConstraintsSchema,
  ImageConstraintsSchema,
  StyleConstraintsSchema,
  CodeConstraintsSchema,
  SlotConstraintsSchema,
  DataConstraintsSchema,
  z.record(z.unknown()),
]).optional();

// --- Agent Metadata ---

export const AgentMetadataSchema = z.object({
  intent: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  safeToRegenerate: z.boolean().optional(),
  contentGuideline: z.string().optional(),
  semanticRole: z.string().optional(),
  affects: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
}).strict().optional();

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

// --- Annotation Metadata ---

export const AnnotationMetadataSchema = z.object({
  type: AnnotationTypeEnum,
  label: z.string().optional(),
  cms: CmsModeEnum,
  constraints: ConstraintsSchema,
  default: z.unknown().optional(),
  group: z.string().optional(),
  order: z.number().optional(),
  agent: AgentMetadataSchema,
  repeatable: z.boolean().optional(),
  maxInstances: z.number().optional(),
});

export type AnnotationMetadata = z.infer<typeof AnnotationMetadataSchema>;

// --- Source Location ---

export const SourceLocationSchema = z.object({
  file: z.string(),
  startLine: z.number(),
  endLine: z.number(),
});

export type SourceLocation = z.infer<typeof SourceLocationSchema>;

// --- Parsed Annotation ---

export interface ParsedAnnotation {
  id: string;
  metadata: AnnotationMetadata;
  content: string;
  source: SourceLocation;
}

// --- Manifest Annotation ---

export const ManifestAnnotationSchema = z.object({
  type: AnnotationTypeEnum,
  label: z.string().optional(),
  cms: CmsModeEnum,
  constraints: ConstraintsSchema,
  default: z.unknown().optional(),
  source: SourceLocationSchema,
  group: z.string().nullable().optional(),
  order: z.number().optional(),
  agent: AgentMetadataSchema,
});

export type ManifestAnnotation = z.infer<typeof ManifestAnnotationSchema>;

// --- Agent Briefing ---

export const AgentProcedureStepSchema = z.object({
  action: z.enum(['read', 'write', 'write-batch', 'validate', 'publish']),
  target: z.string().optional(),
  filter: z.record(z.unknown()).optional(),
  rule: z.string().optional(),
  description: z.string().optional(),
  requiresReview: z.boolean().optional(),
});

export const AgentProcedureSchema = z.object({
  description: z.string(),
  steps: z.array(AgentProcedureStepSchema),
});

export const AgentCapabilitiesSchema = z.object({
  canAddAnnotations: z.boolean().default(false),
  canDeleteAnnotations: z.boolean().default(false),
  canModifyStructure: z.boolean().default(false),
  canModifyContent: z.boolean().default(true),
});

export const AgentBlockSchema = z.object({
  description: z.string(),
  tone: z.string().optional(),
  rules: z.array(z.string()).optional(),
  capabilities: AgentCapabilitiesSchema.optional(),
  procedures: z.record(AgentProcedureSchema).optional(),
}).optional();

// --- Group ---

export const GroupSchema = z.object({
  label: z.string(),
  members: z.array(z.string()),
  repeatable: z.boolean().optional(),
  maxInstances: z.number().optional(),
});

// --- Component ---

export const ComponentSchema = z.object({
  source: z.string(),
  props: z.record(z.object({
    type: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
  })).optional(),
});

// --- Storage Config ---

export const StorageConfigSchema = z.object({
  backend: z.enum(['filesystem', 'postgresql']),
  path: z.string().optional(),
  connectionString: z.string().optional(),
});

// --- Audit Config ---

export const AuditConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxRevisions: z.number().default(50),
});

// --- Project ---

export const ProjectSchema = z.object({
  name: z.string(),
  framework: FrameworkEnum,
  language: z.string(),
  entrypoints: z.array(z.string()),
  renderMode: RenderModeEnum,
});

// --- Full Manifest ---

export const ManifestSchema = z.object({
  version: z.string(),
  generator: z.string(),
  generatedAt: z.string(),
  project: ProjectSchema,
  agent: AgentBlockSchema,
  annotations: z.record(ManifestAnnotationSchema),
  groups: z.record(GroupSchema).optional(),
  components: z.record(ComponentSchema).optional(),
  storage: StorageConfigSchema.optional(),
  audit: AuditConfigSchema.optional(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

// --- Registry Types ---

export interface Author {
  type: AuthorType;
  id?: string;
  channel?: string;
  model?: string;
}

export interface Revision {
  revisionId: string;
  annotationId: string;
  oldValue: unknown;
  newValue: unknown;
  author: Author;
  timestamp: string;
}

export interface AnnotationValue {
  id: string;
  value: unknown;
  updatedAt: string;
  updatedBy: Author;
}

export interface RegistrySnapshot {
  exportedAt: string;
  annotations: Record<string, AnnotationValue>;
  revisions: Record<string, Revision[]>;
}

// --- Validation Types ---

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  annotationId?: string;
  file?: string;
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    totalAnnotations: number;
    byType: Record<string, number>;
    byCms: Record<string, number>;
    agentCoverage: number;
  };
}
