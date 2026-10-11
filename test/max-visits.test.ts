import assert from 'node:assert';
import test from 'node:test';
import { parseMaxVisits } from '../utils/max-visits.ts';

test('empty input means unlimited (null)', () => {
  assert.strictEqual(parseMaxVisits(''), null);
  assert.strictEqual(parseMaxVisits('  '), null);
  assert.strictEqual(parseMaxVisits(undefined), null);
});

test('positive integers are sent as numbers', () => {
  assert.strictEqual(parseMaxVisits('5'), 5);
  assert.strictEqual(parseMaxVisits(' 12 '), 12);
});

test('non-numeric, zero, negative and fractional input is rejected', () => {
  for (const bad of ['abc', '0', '-3', '1.5', '1e3', '5x']) {
    assert.throws(() => parseMaxVisits(bad), /positive whole number/, bad);
  }
});
