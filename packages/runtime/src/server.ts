import { Hono } from 'hono';
import type { Manifest, FilesystemRegistry, MemoryRegistry } from '@kintsugi/core';
import type { RuntimeConfig } from './config';
import { loadConfig } from './config';
import { healthRoutes } from './routes/health';
import { manifestRoutes } from './routes/manifest';
import { agentRoutes } from './routes/agent';
import { annotationRoutes } from './routes/annotations';
import { assetRoutes } from './routes/assets';
import { publishRoutes } from './routes/publish';
import { stateRoutes } from './routes/state';

export interface AppState {
  config: RuntimeConfig;
  manifest: Manifest;
  registry: FilesystemRegistry | MemoryRegistry;
}

// Extend Hono context variable types
declare module 'hono' {
  interface ContextVariableMap {
    state: AppState;
  }
}

export function createApp(state: AppState): Hono {
  const app = new Hono();

  // Inject state into context
  app.use('*', async (c, next) => {
    c.set('state', state);
    await next();
  });

  app.route('/health', healthRoutes());
  app.route('/manifest', manifestRoutes());
  app.route('/agent', agentRoutes());
  app.route('/annotations', annotationRoutes());
  app.route('/assets', assetRoutes());
  app.route('/', publishRoutes());
  app.route('/', stateRoutes());

  return app;
}

// Only start HTTP server if run directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isMain) {
  const { serve } = await import('@hono/node-server');
  const { createRegistry } = await import('./lib/registry-loader');
  const { parseManifestFile } = await import('@kintsugi/core');

  const { readFile } = await import('node:fs/promises');
  const config = loadConfig();

  const raw = await readFile(config.manifestPath, 'utf-8');
  const parsed = parseManifestFile(raw);
  if (!parsed.success) {
    console.error(`Failed to load manifest: ${parsed.error}`);
    process.exit(1);
  }

  const registry = await createRegistry(config.storagePath);
  const app = createApp({ config, manifest: parsed.data, registry });

  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`@kintsugi/runtime listening on http://localhost:${info.port}`);
  });
}
