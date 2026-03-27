import { Hono } from 'hono';
import type { AppState } from '../server';
import type { ManifestAnnotation } from '@kintsugi/core';

interface BriefingAnnotation {
  id: string;
  type: string;
  cms: string;
  intent?: string;
  priority?: string;
}

export function agentRoutes(): Hono {
  const app = new Hono();

  app.get('/briefing', (c) => {
    const state = c.get('state') as AppState;
    const { manifest } = state;
    const annotations = manifest.annotations;

    let editable = 0;
    let aiOnly = 0;
    let humanOnly = 0;
    let locked = 0;

    const briefingAnnotations: BriefingAnnotation[] = [];

    for (const [id, ann] of Object.entries(annotations) as [string, ManifestAnnotation][]) {
      switch (ann.cms) {
        case 'editable': editable++; break;
        case 'ai-only': aiOnly++; break;
        case 'human-only': humanOnly++; break;
        case 'locked': locked++; break;
      }

      // Only include annotations with agent metadata in the briefing
      if (ann.agent) {
        briefingAnnotations.push({
          id,
          type: ann.type,
          cms: ann.cms,
          intent: ann.agent.intent,
          priority: ann.agent.priority,
        });
      }
    }

    const total = Object.keys(annotations).length;

    return c.json({
      project: manifest.project.name,
      description: manifest.agent?.description ?? '',
      capabilities: manifest.agent?.capabilities ?? {},
      rules: manifest.agent?.rules ?? [],
      annotations: briefingAnnotations,
      stats: { total, editable, aiOnly, humanOnly, locked },
    });
  });

  return app;
}
