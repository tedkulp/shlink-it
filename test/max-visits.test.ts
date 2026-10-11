import { describe, expect, it } from 'vitest';
import { parseMaxVisits } from '@/utils/max-visits';

describe('parseMaxVisits', () => {
  it('treats empty input as unlimited (null)', () => {
    expect(parseMaxVisits('')).toBeNull();
    expect(parseMaxVisits('  ')).toBeNull();
    expect(parseMaxVisits(undefined)).toBeNull();
  });

  it('sends positive integers as numbers', () => {
    expect(parseMaxVisits('5')).toBe(5);
    expect(parseMaxVisits(' 12 ')).toBe(12);
  });

  it.each(['abc', '0', '-3', '1.5', '1e3', '5x'])('rejects %j', (bad) => {
    expect(() => parseMaxVisits(bad)).toThrow(/positive whole number/);
  });
});
