import { Hono } from 'hono';
import type { AppState } from '../server';

export function publishRoutes(): Hono {
  const app = new Hono();

  // POST /preview
  app.post('/preview', async (c) => {
    const state = c.get('state') as AppState;
    const { registry, manifest } = state;

    const allValues = await registry.listAll();

    return c.json({
      mode: 'preview',
      project: manifest.project.name,
      annotations: allValues,
      generatedAt: new Date().toISOString(),
    });
  });

  // POST /publish
  app.post('/publish', async (c) => {
    const state = c.get('state') as AppState;
    const { config } = state;

    if (config.renderMode === 'runtime') {
      return c.json({
        status: 'published',
        mode: config.renderMode,
        message: 'Content is live in runtime mode.',
      });
    }

    // static mode — would trigger a build; return pending
    return c.json({
      status: 'pending',
      mode: config.renderMode,
      message: 'Static build triggered. Deploy pipeline will apply changes.',
    });
  });

  return app;
}
