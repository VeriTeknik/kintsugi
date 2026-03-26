import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Framework } from '../types';

interface DetectionResult {
  framework: Framework;
  language: string;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectFramework(root: string): Promise<DetectionResult> {
  if (await fileExists(join(root, 'pyproject.toml')) ||
      await fileExists(join(root, 'requirements.txt'))) {
    return { framework: 'python', language: 'python' };
  }

  const pkgPath = join(root, 'package.json');
  if (!(await fileExists(pkgPath))) {
    return { framework: 'html', language: 'html' };
  }

  let pkg: Record<string, unknown>;
  try {
    const content = await readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(content);
  } catch {
    return { framework: 'html', language: 'html' };
  }

  const allDeps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  const hasTS = await fileExists(join(root, 'tsconfig.json')) || 'typescript' in allDeps;
  const language = hasTS ? 'typescript' : 'javascript';

  if ('next' in allDeps) return { framework: 'nextjs', language };
  if ('astro' in allDeps) return { framework: 'astro', language };
  if ('svelte' in allDeps || '@sveltejs/kit' in allDeps) return { framework: 'svelte', language };
  if ('vue' in allDeps || '@vue/cli-service' in allDeps || 'nuxt' in allDeps) return { framework: 'vue', language };
  if ('react' in allDeps) return { framework: 'react', language };

  return { framework: 'html', language };
}
