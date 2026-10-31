import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRupees, checkAmount, formatINR, splitINR, MAX_TRANSFER } from './money.js';

describe('parseRupees', () => {
  it('converts typed rupees to integer paise', () => {
    assert.equal(parseRupees('12'), 1200);
    assert.equal(parseRupees('12.5'), 1250);
    assert.equal(parseRupees('0.07'), 7);
    assert.equal(parseRupees(' 1,234.56 '), 123456);
  });
  it('avoids floating-point drift', () => {
    assert.equal(parseRupees('0.1') + parseRupees('0.2'), parseRupees('0.3'));
    assert.equal(parseRupees('19.99'), 1999);
  });
  it('rejects anything that is not a plain amount', () => {
    for (const bad of ['', 'abc', '1.234', '-5', '.5', '1e3', '1..2', '₹5']) {
      assert.equal(parseRupees(bad), null, `"${bad}" should be rejected`);
    }
  });
});

describe('checkAmount', () => {
  it('enforces minimum and maximum', () => {
    assert.ok(checkAmount('0.50', MAX_TRANSFER).error);
    assert.ok(checkAmount('50001', MAX_TRANSFER).error);
    assert.equal(checkAmount('50000', MAX_TRANSFER).paise, 5000000);
  });
  it('asks for an amount when empty', () => {
    assert.equal(checkAmount('  ', MAX_TRANSFER).error, 'Enter an amount');
  });
});

describe('formatting', () => {
  it('uses Indian digit grouping', () => {
    assert.equal(formatINR(123456), '₹1,234.56');
    assert.equal(formatINR(12345600), '₹1,23,456.00');
  });
  it('splits whole rupees from paise', () => {
    assert.deepEqual(splitINR(1248050), ['₹12,480', '50']);
  });
});
