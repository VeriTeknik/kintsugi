import { Hono } from 'hono';
import { VERSION } from '@kintsugi/core';
import type { AppState } from '../server';

export function healthRoutes(): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const state = c.get('state') as AppState;
    const annotationCount = Object.keys(state.manifest.annotations).length;

    return c.json({
      status: 'ok',
      version: VERSION,
      annotationCount,
      renderMode: state.config.renderMode,
    });
  });

  return app;
}
