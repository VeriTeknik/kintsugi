import { Hono } from 'hono';
import type { AppState } from '../server';
import type { RegistrySnapshot } from '@kintsugi/core';

export function stateRoutes(): Hono {
  const app = new Hono();

  // POST /export
  app.post('/export', async (c) => {
    const state = c.get('state') as AppState;
    const snapshot = await state.registry.export();
    return c.json(snapshot);
  });

  // POST /import
  app.post('/import', async (c) => {
    const state = c.get('state') as AppState;
    const body = await c.req.json() as RegistrySnapshot;
    await state.registry.import(body);
    return c.json({ status: 'imported', annotationCount: Object.keys(body.annotations).length });
  });

  return app;
}
