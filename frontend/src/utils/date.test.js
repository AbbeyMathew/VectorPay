import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, dayLabel, greeting, endOfMonth } from './date.js';

describe('date helpers', () => {
  const now = new Date(2026, 9, 30, 14, 5);

  it('builds zero-padded local day keys', () => {
    assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
  });
  it('labels today and yesterday', () => {
    assert.equal(dayLabel(new Date(2026, 9, 30, 1), now), 'Today');
    assert.equal(dayLabel(new Date(2026, 9, 29, 23), now), 'Yesterday');
  });
  it('labels older days with a date, adding the year only when it differs', () => {
    assert.doesNotMatch(dayLabel(new Date(2026, 8, 12), now), /2026/);
    assert.match(dayLabel(new Date(2025, 8, 12), now), /2025/);
  });
  it('finds the last day of a month, including leap years', () => {
    assert.equal(endOfMonth(2028, 1).getDate(), 29);
    assert.equal(endOfMonth(2026, 1).getDate(), 28);
  });
  it('greets by time of day', () => {
    assert.equal(greeting(new Date(2026, 0, 1, 9)), 'Good morning');
    assert.equal(greeting(new Date(2026, 0, 1, 13)), 'Good afternoon');
    assert.equal(greeting(new Date(2026, 0, 1, 20)), 'Good evening');
  });
});
