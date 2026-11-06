import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, crossover } from './compare.mjs';
test('crossover distinguishes a tie from a strictly faster whole minute', () => {
  assert.deepEqual(crossover(30, 2, 1), { tie: 15, faster: 14 });
  assert.deepEqual(crossover(31, 2, 1), { tie: 15.5, faster: 15 });
  assert.equal(crossover(30, 0, 1), null);
});
const row = (id, status = 'pass', gap = '') => ({ id, status, gap });
test('deduplicates candidates and excludes shared passes from preference', () => {
  const result = compare([{ minutes: 30, rows: [row(' X '), row('x'), row('A')] }, { minutes: 30, rows: [row('x'), row('B', 'pending', '上线经历')] }]);
  assert.equal(result.unique, 3);
  assert.equal(result.shared, 1);
  assert.equal(result.routes[0].unique, 2);
  assert.equal(result.routes[0].exclusivePass, 1);
  assert.equal(result.routes[1].topGap, '上线经历');
  assert.equal(result.preferred, 0);
});
test('conflicting assessments count as pending', () => {
  const result = compare([{ minutes: 30, rows: [row('A'), row('a', 'fail')] }, { minutes: 30, rows: [] }]);
  assert.equal(result.routes[0].pass, 0);
  assert.equal(result.routes[0].pending, 1);
  assert.equal(result.preferred, null);
});
test('compares exclusive passes per hour and handles ties and missing time', () => {
  const a = { minutes: 60, rows: [row('A'), row('C')] };
  const b = { minutes: 30, rows: [row('B')] };
  assert.equal(compare([a, b]).preferred, null);
  assert.equal(compare([a, { ...b, minutes: 20 }]).preferred, 1);
  assert.equal(compare([a, { ...b, minutes: 0 }]).preferred, null);
});
