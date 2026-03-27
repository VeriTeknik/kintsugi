import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import { parse, generateManifest, serializeManifest } from '@kintsugi/core';

export interface InitResult {
  manifestPath: string;
  rcPath: string;
  annotationCount: number;
  framework: string;
}

export async function initProject(root: string, name: string): Promise<InitResult> {
  const parseResult = await parse(root);
  const manifest = generateManifest(parseResult, name);

  const manifestPath = join(root, 'kintsugi.json');
  const rcPath = join(root, '.kintsugirc.json');

  const rc = {
    manifest: 'kintsugi.json',
    storage: { backend: 'filesystem', path: '.kintsugi/' },
  };

  await Promise.all([
    writeFile(manifestPath, serializeManifest(manifest), 'utf-8'),
    writeFile(rcPath, JSON.stringify(rc, null, 2), 'utf-8'),
  ]);

  return {
    manifestPath,
    rcPath,
    annotationCount: Object.keys(manifest.annotations).length,
    framework: parseResult.framework,
  };
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Parse project and generate kintsugi.json + .kintsugirc.json')
    .argument('[root]', 'Project root directory', process.cwd())
    .option('-n, --name <name>', 'Project name', 'my-project')
    .action(async (root: string, opts: { name: string }) => {
      try {
        const result = await initProject(root, opts.name);
        console.log(`Initialized kintsugi project (${result.framework})`);
        console.log(`  Manifest: ${result.manifestPath}`);
        console.log(`  RC:       ${result.rcPath}`);
        console.log(`  Found ${result.annotationCount} annotation(s)`);
      } catch (err) {
        console.error('init failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
