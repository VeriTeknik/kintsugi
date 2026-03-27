# Kintsugi

**AI-native content annotation framework.**

> *Kintsugi (金継ぎ): The Japanese art of repairing broken pottery with gold.*
> AI creates. Human edits don't break — they become golden seams.

Kintsugi embeds annotations in AI-generated code that define editable surfaces. These annotations serve as a contract between three parties:

- **The generating AI** — knows which regions it can regenerate safely
- **The visiting AI agent** — knows what the site contains and how to modify it
- **The human** — gets a CMS-like editor without touching code

## How It Works

Add annotations as comments in your source files:

```html
<!-- kintsugi:hero-title {"type":"text","label":"Main Title","cms":"editable","agent":{"intent":"primary-headline","priority":"critical"}} -->
<h1>The Center of Digital Transformation</h1>
<!-- /kintsugi:hero-title -->
```

Then parse, validate, and manage content through the Kintsugi API:

```typescript
import { parse, generateManifest, validate, MemoryRegistry } from '@kintsugi/core';

// 1. Parse annotations from source files
const result = await parse('./my-project');

// 2. Generate a manifest (kintsugi.json)
const manifest = generateManifest(result, 'my-project');

// 3. Validate everything is consistent
const validation = await validate(manifest, './my-project');
console.log(validation.stats);
// { totalAnnotations: 12, byType: { text: 5, image: 3, ... }, agentCoverage: 83 }

// 4. Track content changes with full revision history
const registry = new MemoryRegistry();
await registry.set('hero-title', 'New Headline', {
  type: 'human', id: 'user-1', channel: 'web'
});
```

## Annotation Types

| Type | Description |
|------|-------------|
| `text` | Plain text content |
| `richtext` | Rich text (HTML subset) |
| `image` | Visual assets with format/size constraints |
| `code` | Code blocks (analytics, embeds) |
| `slot` | Component injection points |
| `group` | Bundled annotations (repeatable, max 2 levels) |
| `style` | CSS / Tailwind values |
| `data` | Structured JSON data |

## CMS Access Modes

| Mode | Human | AI Agent | Use Case |
|------|-------|----------|----------|
| `editable` | write | write | Default — content fields |
| `locked` | — | — | Structural code |
| `ai-only` | — | write | Analytics, SEO meta |
| `human-only` | write | — | Logo, brand colors, legal |

## Comment Syntax

Three dialects, one semantic:

```
HTML/JSX:     <!-- kintsugi:ID {JSON} -->  content  <!-- /kintsugi:ID -->
JS/TS/CSS:    /* kintsugi:ID {JSON} */     content  /* /kintsugi:ID */
Python/YAML:  # kintsugi:ID {JSON}         content  # /kintsugi:ID
```

## AI-Native Design

Every annotation can carry `agent` metadata — invisible to the CMS but readable by AI agents:

```json
{
  "agent": {
    "intent": "primary-headline",
    "priority": "critical",
    "safeToRegenerate": false,
    "contentGuideline": "Action-oriented, no jargon",
    "affects": ["meta-title", "og-title"],
    "tags": ["seo", "above-fold"]
  }
}
```

The manifest's `agent` block provides a project-level briefing — description, rules, capabilities, and named procedures — so any visiting agent can orient itself without scanning all files.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@kintsugi/core` | Parser, manifest, validator, registry | v0.1.0 |
| `@kintsugi/cli` | CLI commands (init, extract, validate, watch) | Planned |
| `@kintsugi/runtime` | Sidecar HTTP server (Hono, port 4100) | Planned |

## Validation

13 error rules (E001–E013) and 6 warning rules (W001–W006):

- Source/manifest sync verification
- Type and CMS mode validation
- Group integrity (max 2 levels nesting)
- Agent procedure and `affects` cross-references
- Per-type constraint checking (text length, image format, richtext tags)

## Registry

Pluggable storage backends with full revision history:

- **MemoryRegistry** — in-memory, for tests
- **FilesystemRegistry** — PVC-compatible disk storage with per-annotation revision files

Every change is tracked with author attribution (human, AI agent, or system), channel, and timestamp. Rollback to any revision.

## Development

```bash
pnpm install
pnpm test:run    # 73 tests
pnpm build       # TypeScript compilation
pnpm lint        # Type checking
```

## License

Apache 2.0
