import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import { parseManifestFile } from '@kintsugi/core';

export interface BriefingStats {
  total: number;
  editable: number;
  aiOnly: number;
  humanOnly: number;
  locked: number;
}

export interface AgentBriefing {
  project: string;
  framework: string;
  annotationCount: number;
  stats: BriefingStats;
  annotations: Record<string, {
    type: string;
    cms: string;
    label?: string;
    agent?: {
      intent?: string;
      priority?: string;
      safeToRegenerate?: boolean;
      tags?: string[];
    };
  }>;
}

export async function generateBriefing(root: string): Promise<AgentBriefing> {
  const manifestPath = join(root, 'kintsugi.json');
  const content = await readFile(manifestPath, 'utf-8');

  const parsed = parseManifestFile(content);
  if (!parsed.success) {
    throw new Error(`Invalid manifest: ${parsed.error}`);
  }

  const { project, annotations } = parsed.data;
  const entries = Object.entries(annotations);

  const stats: BriefingStats = {
    total: entries.length,
    editable: 0,
    aiOnly: 0,
    humanOnly: 0,
    locked: 0,
  };

  const briefAnnotations: AgentBriefing['annotations'] = {};

  for (const [id, ann] of entries) {
    // tally stats
    if (ann.cms === 'editable') stats.editable++;
    else if (ann.cms === 'ai-only') stats.aiOnly++;
    else if (ann.cms === 'human-only') stats.humanOnly++;
    else if (ann.cms === 'locked') stats.locked++;

    // compact representation — omit source/constraints/default for token efficiency
    briefAnnotations[id] = {
      type: ann.type,
      cms: ann.cms,
      ...(ann.label ? { label: ann.label } : {}),
      ...(ann.agent ? { agent: ann.agent } : {}),
    };
  }

  return {
    project: project.name,
    framework: project.framework,
    annotationCount: entries.length,
    stats,
    annotations: briefAnnotations,
  };
}

export function registerAgentBriefCommand(program: Command): void {
  program
    .command('agent-brief')
    .description('Generate token-efficient agent briefing JSON')
    .argument('[root]', 'Project root directory', process.cwd())
    .action(async (root: string) => {
      try {
        const briefing = await generateBriefing(root);
        console.log(JSON.stringify(briefing, null, 2));
      } catch (err) {
        console.error('agent-brief failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
