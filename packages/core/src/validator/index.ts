import { runRules } from './rules';
import type { Manifest, ValidationResult } from '../types';

export async function validate(
  manifest: Manifest,
  projectRoot: string,
): Promise<ValidationResult> {
  const { errors, warnings } = await runRules(manifest, projectRoot);

  const annotations = Object.values(manifest.annotations);
  const totalAnnotations = annotations.length;

  const byType: Record<string, number> = {};
  const byCms: Record<string, number> = {};
  let withAgent = 0;

  for (const ann of annotations) {
    byType[ann.type] = (byType[ann.type] ?? 0) + 1;
    byCms[ann.cms] = (byCms[ann.cms] ?? 0) + 1;
    if (ann.agent) withAgent++;
  }

  const agentCoverage = totalAnnotations > 0
    ? Math.round((withAgent / totalAnnotations) * 100)
    : 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { totalAnnotations, byType, byCms, agentCoverage },
  };
}
