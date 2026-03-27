import { MemoryRegistry } from '@kintsugi/core';
import type { Manifest } from '@kintsugi/core';
import { createApp } from '../src/server';
import type { AppState } from '../src/server';
import type { RuntimeConfig } from '../src/config';

export const TEST_MANIFEST: Manifest = {
  version: '1',
  generator: '@kintsugi/cli',
  generatedAt: '2026-01-01T00:00:00.000Z',
  project: {
    name: 'test-project',
    framework: 'nextjs',
    language: 'typescript',
    entrypoints: ['src/app'],
    renderMode: 'static',
  },
  agent: {
    description: 'AI content assistant for test-project',
    tone: 'professional',
    rules: [
      'Never modify locked annotations',
      'Prefer short, scannable copy',
    ],
    capabilities: {
      canAddAnnotations: false,
      canDeleteAnnotations: false,
      canModifyStructure: false,
      canModifyContent: true,
    },
  },
  annotations: {
    'hero-title': {
      type: 'text',
      cms: 'editable',
      source: { file: 'src/components/Hero.tsx', startLine: 10, endLine: 10 },
      agent: { intent: 'primary-headline', priority: 'critical' },
    },
    'hero-bg': {
      type: 'image',
      cms: 'editable',
      source: { file: 'src/components/Hero.tsx', startLine: 20, endLine: 20 },
      agent: { intent: 'hero-visual', priority: 'high' },
    },
    'analytics': {
      type: 'code',
      cms: 'ai-only',
      source: { file: 'src/app/layout.tsx', startLine: 5, endLine: 15 },
    },
    'brand-logo': {
      type: 'image',
      cms: 'human-only',
      source: { file: 'src/components/Header.tsx', startLine: 3, endLine: 3 },
    },
  },
};

const TEST_CONFIG: RuntimeConfig = {
  port: 4100,
  manifestPath: '/app/kintsugi.json',
  storagePath: '/tmp/kintsugi-test',
  renderMode: 'static',
  authEnabled: false,
  authHeader: 'x-forwarded-user',
};

export function createTestApp(overrides?: Partial<AppState>) {
  const registry = new MemoryRegistry();
  const state: AppState = {
    config: TEST_CONFIG,
    manifest: TEST_MANIFEST,
    registry,
    ...overrides,
  };
  const app = createApp(state);
  return { app, state, registry };
}
