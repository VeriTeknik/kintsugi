import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import { validate, parseManifestFile } from '@kintsugi/core';
import type { ValidationResult } from '@kintsugi/core';

export interface ValidateResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  stats: ValidationResult['stats'];
}

export async function validateProject(root: string, strict: boolean = false): Promise<ValidateResult> {
  const manifestPath = join(root, 'kintsugi.json');
  const content = await readFile(manifestPath, 'utf-8');

  const parsed = parseManifestFile(content);
  if (!parsed.success) {
    throw new Error(`Invalid manifest: ${parsed.error}`);
  }

  const result = await validate(parsed.data, root);

  // In strict mode, warnings are treated as errors
  const effectiveErrors = strict
    ? result.errors.length + result.warnings.length
    : result.errors.length;

  return {
    valid: effectiveErrors === 0,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    stats: result.stats,
  };
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Validate manifest against source')
    .argument('[root]', 'Project root directory', process.cwd())
    .option('-s, --strict', 'Treat warnings as errors', false)
    .action(async (root: string, opts: { strict: boolean }) => {
      try {
        const result = await validateProject(root, opts.strict);
        if (result.valid) {
          console.log('Validation passed');
        } else {
          console.error(`Validation failed: ${result.errorCount} error(s), ${result.warningCount} warning(s)`);
        }
        console.log(`  Annotations: ${result.stats.totalAnnotations}`);
        console.log(`  Agent coverage: ${result.stats.agentCoverage}%`);
        if (!result.valid) process.exit(1);
      } catch (err) {
        console.error('validate failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
