process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { normalizePhone, isValidPhone } = require('../src/utils/phone');
const { safeTimeZone } = require('../src/utils/timezone');
const { generateOtp, hashOtp, otpMatches } = require('../src/utils/otp');
const { formatRupees, LIMITS } = require('../src/utils/money');
const { signResetToken, verifyResetToken, signSession } = require('../src/utils/token');

describe('phone', () => {
  it('strips formatting and country/trunk prefixes', () => {
    assert.equal(normalizePhone('98765 43210'), '9876543210');
    assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
    assert.equal(normalizePhone('09876543210'), '9876543210');
  });
  it('validates ten digits', () => {
    assert.equal(isValidPhone('9876543210'), true);
    assert.equal(isValidPhone('987654321'), false);
    assert.equal(isValidPhone('98765432100'), false);
    assert.equal(isValidPhone(normalizePhone(undefined)), false);
  });
});

describe('timezone', () => {
  it('accepts real zones and falls back to UTC otherwise', () => {
    assert.equal(safeTimeZone('Asia/Kolkata'), 'Asia/Kolkata');
    assert.equal(safeTimeZone('Not/AZone'), 'UTC');
    assert.equal(safeTimeZone(undefined), 'UTC');
    assert.equal(safeTimeZone('"; drop table'), 'UTC');
  });
});

describe('otp', () => {
  it('generates 6-digit codes', () => {
    for (let i = 0; i < 200; i += 1) assert.match(generateOtp(), /^\d{6}$/);
  });
  it('matches only the right code for the right email', () => {
    const hash = hashOtp('a@example.test', '123456');
    assert.equal(otpMatches('a@example.test', '123456', hash), true);
    assert.equal(otpMatches('a@example.test', '654321', hash), false);
    assert.equal(otpMatches('b@example.test', '123456', hash), false);
  });
});

describe('money', () => {
  it('formats paise as rupees with Indian digit grouping', () => {
    assert.equal(formatRupees(123456), '₹1,234.56');
    assert.equal(formatRupees(LIMITS.maxTopUp), '₹1,00,000.00');
  });
});

describe('tokens', () => {
  it('reset tokens round-trip and cannot be mistaken for session tokens', () => {
    assert.equal(verifyResetToken(signResetToken('a@example.test')).email, 'a@example.test');
    assert.throws(() => verifyResetToken(signSession('507f1f77bcf86cd799439011')));
  });
});
