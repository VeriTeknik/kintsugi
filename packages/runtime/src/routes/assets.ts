import { Hono } from 'hono';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppState } from '../server';

export function assetRoutes(): Hono {
  const app = new Hono();

  // POST /assets/upload
  app.post('/upload', async (c) => {
    const state = c.get('state') as AppState;
    const { config } = state;

    if (!config.storagePath || config.storagePath === '') {
      return c.json({ error: 'Storage not configured' }, 501);
    }

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: 'Invalid multipart form data' }, 400);
    }

    const file = formData.get('file') as File | null;
    const annotationId = formData.get('annotationId') as string | null;

    if (!file) {
      return c.json({ error: 'file field is required' }, 400);
    }

    const ext = extname(file.name) || '';
    const assetId = randomUUID();
    const filename = `${assetId}${ext}`;
    const assetsDir = join(config.storagePath, 'assets');

    try {
      await mkdir(assetsDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(assetsDir, filename), buffer);
    } catch {
      return c.json({ error: 'Storage not configured' }, 501);
    }

    return c.json({
      assetId,
      filename,
      annotationId: annotationId ?? null,
      path: `/assets/${filename}`,
    });
  });

  return app;
}
