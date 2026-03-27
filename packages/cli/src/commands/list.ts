import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import { parseManifestFile } from '@kintsugi/core';
import type { ManifestAnnotation, AnnotationType, CmsMode } from '@kintsugi/core';

export interface ListFilter {
  type?: AnnotationType;
  cms?: CmsMode;
  tag?: string;
}

export interface ListEntry {
  id: string;
  annotation: ManifestAnnotation;
}

export async function listAnnotations(root: string, filter: ListFilter = {}): Promise<ListEntry[]> {
  const manifestPath = join(root, 'kintsugi.json');
  const content = await readFile(manifestPath, 'utf-8');

  const parsed = parseManifestFile(content);
  if (!parsed.success) {
    throw new Error(`Invalid manifest: ${parsed.error}`);
  }

  const entries: ListEntry[] = Object.entries(parsed.data.annotations).map(
    ([id, annotation]) => ({ id, annotation }),
  );

  return entries.filter(({ annotation }) => {
    if (filter.type && annotation.type !== filter.type) return false;
    if (filter.cms && annotation.cms !== filter.cms) return false;
    if (filter.tag) {
      const tags = annotation.agent?.tags ?? [];
      if (!tags.includes(filter.tag)) return false;
    }
    return true;
  });
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List annotations with optional filters')
    .argument('[root]', 'Project root directory', process.cwd())
    .option('-t, --type <type>', 'Filter by annotation type')
    .option('-c, --cms <mode>', 'Filter by CMS mode')
    .option('--tag <tag>', 'Filter by agent tag')
    .action(async (root: string, opts: { type?: string; cms?: string; tag?: string }) => {
      try {
        const filter: ListFilter = {
          type: opts.type as AnnotationType | undefined,
          cms: opts.cms as CmsMode | undefined,
          tag: opts.tag,
        };
        const entries = await listAnnotations(root, filter);
        if (entries.length === 0) {
          console.log('No annotations match the given filters.');
          return;
        }
        for (const { id, annotation } of entries) {
          console.log(`${id}  [${annotation.type}] [${annotation.cms}]  ${annotation.label ?? ''}`);
        }
      } catch (err) {
        console.error('list failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
