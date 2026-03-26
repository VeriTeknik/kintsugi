import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseAnnotations } from '../../src/parser/annotation';

const FIXTURES = resolve(__dirname, '../fixtures');

describe('parseAnnotations', () => {
  it('parses HTML-style annotations', async () => {
    const content = await readFile(
      resolve(FIXTURES, 'html-project/index.html'), 'utf-8'
    );
    const { annotations, errors } = parseAnnotations(content, 'index.html');

    expect(errors).toHaveLength(0);
    expect(annotations).toHaveLength(4);
    expect(annotations[0].id).toBe('page-title');
    expect(annotations[0].metadata.type).toBe('text');
    expect(annotations[0].metadata.cms).toBe('editable');
    expect(annotations[0].content).toContain('<h1>Welcome</h1>');
  });

  it('parses JSX-style annotations', async () => {
    const content = await readFile(
      resolve(FIXTURES, 'nextjs-project/src/app/page.tsx'), 'utf-8'
    );
    const { annotations, errors } = parseAnnotations(content, 'src/app/page.tsx');

    expect(errors).toHaveLength(0);
    expect(annotations.length).toBe(7);

    const heroTitle = annotations.find(a => a.id === 'hero-title');
    expect(heroTitle).toBeDefined();
    expect(heroTitle!.metadata.type).toBe('text');
    expect(heroTitle!.metadata.agent?.intent).toBe('primary-headline');
    expect(heroTitle!.metadata.agent?.priority).toBe('critical');
    expect(heroTitle!.content).toContain('Digital Transformation');
  });

  it('captures source line numbers', async () => {
    const content = await readFile(
      resolve(FIXTURES, 'html-project/index.html'), 'utf-8'
    );
    const { annotations } = parseAnnotations(content, 'index.html');

    const title = annotations.find(a => a.id === 'page-title')!;
    expect(title.source.file).toBe('index.html');
    expect(title.source.startLine).toBeGreaterThan(0);
    expect(title.source.endLine).toBeGreaterThan(title.source.startLine);
  });

  it('parses group annotations with children', async () => {
    const content = await readFile(
      resolve(FIXTURES, 'nextjs-project/src/app/page.tsx'), 'utf-8'
    );
    const { annotations } = parseAnnotations(content, 'src/app/page.tsx');

    const group = annotations.find(a => a.id === 'pricing-card');
    expect(group).toBeDefined();
    expect(group!.metadata.type).toBe('group');
    expect(group!.metadata.repeatable).toBe(true);
    expect(group!.metadata.maxInstances).toBe(5);

    const planName = annotations.find(a => a.id === 'plan-name');
    expect(planName).toBeDefined();
    expect(planName!.metadata.group).toBe('pricing-card');
  });

  it('reports error for unclosed annotation', () => {
    const content = `<!-- kintsugi:broken {"type":"text","cms":"editable"} -->
<h1>No close tag</h1>`;
    const { errors } = parseAnnotations(content, 'broken.html');
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe('E004');
  });

  it('reports error for invalid JSON', () => {
    const content = `<!-- kintsugi:bad {invalid json} -->
<h1>Bad</h1>
<!-- /kintsugi:bad -->`;
    const { errors } = parseAnnotations(content, 'bad.html');
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe('E005');
  });

  it('reports error for duplicate IDs', () => {
    const content = `<!-- kintsugi:dup {"type":"text","cms":"editable"} -->
<h1>First</h1>
<!-- /kintsugi:dup -->
<!-- kintsugi:dup {"type":"text","cms":"editable"} -->
<h1>Second</h1>
<!-- /kintsugi:dup -->`;
    const { errors } = parseAnnotations(content, 'dup.html');
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe('E003');
  });
});
