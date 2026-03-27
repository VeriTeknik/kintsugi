import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import {
  parse,
  generateManifest,
  mergeManifest,
  parseManifestFile,
  serializeManifest,
} from '@kintsugi/core';
import type { ParsedAnnotation } from '@kintsugi/core';

export type ExtractFormat = 'json' | 'manifest';

export interface ExtractResult {
  format: ExtractFormat;
  annotations?: ParsedAnnotation[];
  manifestPath?: string;
  annotationCount: number;
}

export async function extractAnnotations(
  root: string,
  format: ExtractFormat = 'json',
): Promise<ExtractResult> {
  const parseResult = await parse(root);

  if (format === 'json') {
    return {
      format,
      annotations: parseResult.annotations,
      annotationCount: parseResult.annotations.length,
    };
  }

  // manifest mode: generate fresh, merge with existing if present
  const fresh = generateManifest(parseResult, root.split('/').pop() ?? 'project');
  const manifestPath = join(root, 'kintsugi.json');

  let final = fresh;
  try {
    const existing = await readFile(manifestPath, 'utf-8');
    const parsed = parseManifestFile(existing);
    if (parsed.success) {
      final = mergeManifest(parsed.data, fresh);
    }
  } catch {
    // no existing manifest — use fresh
  }

  await writeFile(manifestPath, serializeManifest(final), 'utf-8');

  return {
    format,
    manifestPath,
    annotationCount: Object.keys(final.annotations).length,
  };
}

export function registerExtractCommand(program: Command): void {
  program
    .command('extract')
    .description('Scan annotations and output as JSON or update manifest')
    .argument('[root]', 'Project root directory', process.cwd())
    .option('-f, --format <format>', 'Output format: json or manifest', 'json')
    .action(async (root: string, opts: { format: string }) => {
      const format = (opts.format === 'manifest' ? 'manifest' : 'json') as ExtractFormat;
      try {
        const result = await extractAnnotations(root, format);
        if (format === 'json') {
          console.log(JSON.stringify(result.annotations, null, 2));
        } else {
          console.log(`Updated manifest: ${result.manifestPath}`);
          console.log(`  ${result.annotationCount} annotation(s)`);
        }
      } catch (err) {
        console.error('extract failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
