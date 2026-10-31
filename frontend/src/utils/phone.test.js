import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, formatPhone, maskPhone } from './phone.js';

describe('phone helpers', () => {
  it('normalizes pasted numbers', () => {
    assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
    assert.equal(normalizePhone('098765 43210'), '9876543210');
  });
  it('formats and masks', () => {
    assert.equal(formatPhone('9876543210'), '98765 43210');
    assert.equal(maskPhone('9876543210'), '•••• 3210');
    assert.equal(maskPhone(''), '');
  });
});
