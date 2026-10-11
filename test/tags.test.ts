import { describe, expect, it } from 'vitest';
import { initialTagsValue, parseTags } from '@/utils/tags';

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

describe('parseTags', () => {
  it('splits on spaces', () => {
    expect(parseTags('work reading later')).toEqual([
      'work',
      'reading',
      'later',
    ]);
  });

  it('drops empty entries from leading, trailing and repeated spaces', () => {
    expect(parseTags('  work   reading ')).toEqual(['work', 'reading']);
  });

  it('returns no tags for empty or all-space input', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags('   ')).toEqual([]);
  });

  it('splits only on the space character, not other whitespace', () => {
    expect(parseTags('work\treading')).toEqual(['work\treading']);
  });

  it('keeps duplicates and case as typed', () => {
    expect(parseTags('Work work work')).toEqual(['Work', 'work', 'work']);
  });

  it('round-trips the pre-filled default tags', () => {
    expect(parseTags(initialTagsValue('work reading'))).toEqual([
      'work',
      'reading',
    ]);
  });
});
