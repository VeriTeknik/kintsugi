import fg from 'fast-glob';
import ignore from 'ignore';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXTENSIONS = [
  '**/*.html', '**/*.htm', '**/*.jsx', '**/*.tsx',
  '**/*.vue', '**/*.svelte', '**/*.astro',
  '**/*.md', '**/*.mdx',
  '**/*.css', '**/*.scss',
  '**/*.py', '**/*.yaml', '**/*.yml',
];

const ALWAYS_IGNORE = [
  'node_modules', '.git', 'dist', 'build', '.next',
  '.kintsugi', '.nuxt', '.output', '__pycache__', '.svelte-kit',
  'coverage', '*.tsbuildinfo',
];

export async function scanFiles(root: string): Promise<string[]> {
  const ig = ignore().add(ALWAYS_IGNORE);

  try {
    const gitignoreContent = await readFile(join(root, '.gitignore'), 'utf-8');
    ig.add(gitignoreContent);
  } catch {
    // No .gitignore - that's fine
  }

  const files = await fg(EXTENSIONS, {
    cwd: root,
    absolute: false,
    dot: false,
    ignore: ALWAYS_IGNORE,
  });

  return files.filter(f => !ig.ignores(f)).sort();
}
