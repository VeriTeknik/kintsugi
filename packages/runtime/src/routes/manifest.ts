import { Hono } from 'hono';
import type { AppState } from '../server';

export function manifestRoutes(): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const state = c.get('state') as AppState;
    return c.json(state.manifest);
  });

  return app;
}
