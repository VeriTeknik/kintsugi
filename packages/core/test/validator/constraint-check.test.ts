import { describe, it, expect } from 'vitest';
import { checkConstraint } from '../../src/validator/constraint-check';

describe('checkConstraint', () => {
  it('validates text maxLength', () => {
    const issues = checkConstraint('title', 'text', { maxLength: 10 }, 'Hello World!');
    expect(issues.length).toBe(1);
    expect(issues[0].code).toBe('W004');
  });

  it('passes valid text', () => {
    const issues = checkConstraint('title', 'text', { maxLength: 50 }, 'Hello');
    expect(issues).toHaveLength(0);
  });

  it('validates text pattern', () => {
    const issues = checkConstraint('price', 'text', { pattern: '^[0-9]+$' }, 'abc');
    expect(issues.length).toBe(1);
  });

  it('validates image constraints', () => {
    const issues = checkConstraint('bg', 'image', {
      allowedFormats: ['webp', 'png'],
    }, '<img src="/photo.jpg" />');
    expect(issues.length).toBe(1);
  });

  it('passes when no constraints', () => {
    const issues = checkConstraint('title', 'text', undefined, 'anything');
    expect(issues).toHaveLength(0);
  });

  it('validates richtext allowedTags', () => {
    const issues = checkConstraint('body', 'richtext', {
      allowedTags: ['p', 'strong'],
    }, '<div><script>alert(1)</script></div>');
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });
});
