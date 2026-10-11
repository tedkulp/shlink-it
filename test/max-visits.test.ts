import { describe, expect, it } from 'vitest';
import { parseMaxVisits } from '@/utils/max-visits';

const field = (value: string, badInput = false) => ({ value, badInput });

describe('parseMaxVisits', () => {
  it('treats empty input as unlimited (null)', () => {
    expect(parseMaxVisits(field(''))).toBeNull();
    expect(parseMaxVisits(field('  '))).toBeNull();
  });

  it('sends positive integers as numbers', () => {
    expect(parseMaxVisits(field('5'))).toBe(5);
    expect(parseMaxVisits(field(' 12 '))).toBe(12);
  });

  // A type=number input accepts these as valid whole numbers.
  it.each([
    ['1e3', 1000],
    ['10.0', 10],
    ['1E2', 100],
    ['2.5e1', 25],
  ])('accepts %j as %i', (raw, expected) => {
    expect(parseMaxVisits(field(raw))).toBe(expected);
  });

  it.each(['abc', '0', '-3', '1.5', '5x', '0x10', 'Infinity', '1e400', '1e-3'])(
    'rejects %j',
    (bad) => {
      expect(() => parseMaxVisits(field(bad))).toThrow(/positive whole number/);
    },
  );

  it('rejects input the browser flagged as bad, even though its value is empty', () => {
    // A number input reports unparseable text (e.g. "abc") as "" with
    // validity.badInput set; that must not read as unlimited.
    expect(() => parseMaxVisits(field('', true))).toThrow(
      /positive whole number/,
    );
  });
});
