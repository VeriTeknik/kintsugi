import { Hono } from 'hono';
import type { AppState } from '../server';
import type { Author, ManifestAnnotation } from '@kintsugi/core';

export function annotationRoutes(): Hono {
  const app = new Hono();

  // GET /annotations - list all with optional filters
  app.get('/', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;

    const typeFilter = c.req.query('type');
    const cmsFilter = c.req.query('cms');
    const tagFilter = c.req.query('tag');

    const allValues = await registry.listAll();

    // Build result filtered by manifest metadata
    const result: Record<string, unknown> = {};

    for (const [id, ann] of Object.entries(manifest.annotations) as [string, ManifestAnnotation][]) {
      if (typeFilter && ann.type !== typeFilter) continue;
      if (cmsFilter && ann.cms !== cmsFilter) continue;
      if (tagFilter && !(ann.agent?.tags ?? []).includes(tagFilter)) continue;

      result[id] = allValues[id] ?? { id, value: ann.default ?? null, updatedAt: null, updatedBy: null };
    }

    return c.json(result);
  });

  // GET /annotations/:id
  app.get('/:id', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;
    const id = c.req.param('id');

    if (!manifest.annotations[id]) {
      return c.json({ error: `Annotation "${id}" not found` }, 404);
    }

    const value = await registry.get(id);
    const ann = manifest.annotations[id] as ManifestAnnotation;

    return c.json(value ?? { id, value: ann.default ?? null, updatedAt: null, updatedBy: null });
  });

  // PUT /annotations/:id
  app.put('/:id', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;
    const id = c.req.param('id');

    const annEntry = manifest.annotations[id] as ManifestAnnotation | undefined;
    if (!annEntry) {
      return c.json({ error: `Annotation "${id}" not found` }, 404);
    }

    if (annEntry.cms === 'locked') {
      return c.json({ error: `Annotation "${id}" is locked` }, 403);
    }

    const body = await c.req.json() as { value: unknown; author: Author };
    const oldEntry = await registry.get(id);
    const oldValue = oldEntry?.value ?? null;

    const revisionId = await registry.set(id, body.value, body.author);

    return c.json({ revisionId, oldValue, newValue: body.value });
  });

  // GET /annotations/:id/history
  app.get('/:id/history', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;
    const id = c.req.param('id');

    if (!manifest.annotations[id]) {
      return c.json({ error: `Annotation "${id}" not found` }, 404);
    }

    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const history = await registry.getHistory(id, limit);
    return c.json(history);
  });

  // POST /annotations/:id/rollback
  app.post('/:id/rollback', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;
    const id = c.req.param('id');

    if (!manifest.annotations[id]) {
      return c.json({ error: `Annotation "${id}" not found` }, 404);
    }

    const body = await c.req.json() as { revisionId: string };
    if (!body.revisionId) {
      return c.json({ error: 'revisionId is required' }, 400);
    }

    try {
      const restored = await registry.rollback(id, body.revisionId);
      return c.json(restored);
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400);
    }
  });

  // POST /annotations/batch
  app.post('/batch', async (c) => {
    const state = c.get('state') as AppState;
    const { manifest, registry } = state;

    const body = await c.req.json() as {
      updates: { id: string; value: unknown }[];
      author: Author;
      procedure?: string;
    };

    const results: { id: string; revisionId: string }[] = [];

    for (const update of body.updates) {
      const annEntry = manifest.annotations[update.id];
      if (!annEntry || (annEntry as ManifestAnnotation).cms === 'locked') {
        continue;
      }
      const revisionId = await registry.set(update.id, update.value, body.author);
      results.push({ id: update.id, revisionId });
    }

    return c.json({ results, procedure: body.procedure ?? null });
  });

  return app;
}
