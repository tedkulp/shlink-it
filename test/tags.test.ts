import { describe, expect, it } from 'vitest';
import { initialTagsValue } from '@/utils/tags';

describe('initialTagsValue', () => {
  it('is empty when no default tags were saved', () => {
    expect(initialTagsValue(undefined)).toBe('');
    expect(initialTagsValue('')).toBe('');
  });

  it('appends a trailing space to saved default tags', () => {
    expect(initialTagsValue('work')).toBe('work ');
    expect(initialTagsValue('work reading')).toBe('work reading ');
  });
});
