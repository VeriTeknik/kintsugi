import { describe, it, expect } from 'vitest';
import { injectAnnotations } from '../../src/inject/html';

describe('injectAnnotations', () => {
  it('replaces text annotation content (HTML comments)', () => {
    const html = `<html><body>
<!-- kintsugi:title {"type":"text","cms":"editable"} -->
<h1>Original Title</h1>
<!-- /kintsugi:title -->
</body></html>`;
    const result = injectAnnotations(html, { title: 'New Title' });
    expect(result).toContain('New Title');
    expect(result).not.toContain('Original Title');
    expect(result).toContain('kintsugi:title');
  });

  it('replaces JSX-style annotation content', () => {
    const html = `<main>
/* kintsugi:hero {"type":"text","cms":"editable"} */
<h1>Old</h1>
/* /kintsugi:hero */
</main>`;
    const result = injectAnnotations(html, { hero: 'New Hero' });
    expect(result).toContain('New Hero');
    expect(result).not.toContain('Old');
  });

  it('preserves annotations without values', () => {
    const html = `<!-- kintsugi:untouched {"type":"text","cms":"editable"} -->
<p>Keep me</p>
<!-- /kintsugi:untouched -->`;
    const result = injectAnnotations(html, {});
    expect(result).toContain('Keep me');
  });

  it('handles image annotation (src replacement)', () => {
    const html = `<!-- kintsugi:bg {"type":"image","cms":"editable"} -->
<img src="/old.webp" alt="Hero" />
<!-- /kintsugi:bg -->`;
    const result = injectAnnotations(html, { bg: '<img src="/new.webp" alt="Hero" />' });
    expect(result).toContain('/new.webp');
  });

  it('handles multiple annotations', () => {
    const html = `<!-- kintsugi:a {"type":"text","cms":"editable"} -->
<h1>A</h1>
<!-- /kintsugi:a -->
<p>separator</p>
<!-- kintsugi:b {"type":"text","cms":"editable"} -->
<p>B</p>
<!-- /kintsugi:b -->`;
    const result = injectAnnotations(html, { a: 'New A', b: 'New B' });
    expect(result).toContain('New A');
    expect(result).toContain('New B');
    expect(result).toContain('separator');
  });
});
