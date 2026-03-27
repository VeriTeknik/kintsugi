import { FilesystemRegistry } from '@kintsugi/core';

export async function createRegistry(storagePath: string): Promise<FilesystemRegistry> {
  const registry = new FilesystemRegistry(storagePath);
  await registry.init();
  return registry;
}
