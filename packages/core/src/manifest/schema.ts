import { ManifestSchema, type Manifest } from '../types';

interface ParseSuccess {
  success: true;
  data: Manifest;
}

interface ParseFailure {
  success: false;
  error: string;
}

export function parseManifestFile(json: string): ParseSuccess | ParseFailure {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${(e as Error).message}` };
  }

  const result = ManifestSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' };
  }

  return { success: true, data: result.data };
}

export function serializeManifest(manifest: Manifest): string {
  return JSON.stringify(manifest, null, 2);
}
