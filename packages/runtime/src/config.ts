export interface RuntimeConfig {
  port: number;
  manifestPath: string;
  storagePath: string;
  renderMode: 'runtime' | 'static';
  appUpstream?: string;
  authEnabled: boolean;
  authHeader: string;
}

export function loadConfig(): RuntimeConfig {
  return {
    port: parseInt(process.env.KINTSUGI_PORT ?? '4100', 10),
    manifestPath: process.env.KINTSUGI_MANIFEST_PATH ?? '/app/kintsugi.json',
    storagePath: process.env.KINTSUGI_STORAGE_PATH ?? '/app/data/.kintsugi',
    renderMode: (process.env.KINTSUGI_RENDER_MODE ?? 'static') as 'runtime' | 'static',
    appUpstream: process.env.KINTSUGI_APP_UPSTREAM,
    authEnabled: process.env.KINTSUGI_AUTH_ENABLED !== 'false',
    authHeader: process.env.KINTSUGI_AUTH_HEADER ?? 'x-forwarded-user',
  };
}
