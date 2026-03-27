import { describe, it, expect } from 'vitest';
import { createTestApp } from '../helpers';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const { app } = createTestApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });

  it('returns correct shape', async () => {
    const { app } = createTestApp();
    const res = await app.request('/health');
    const body = await res.json();

    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.annotationCount).toBe(4);
    expect(body.renderMode).toBe('static');
  });
});
