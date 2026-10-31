/**
 * All money is stored and transferred as integer paise (1 rupee = 100 paise).
 * Integers avoid the rounding errors you get with floating-point rupees.
 */
const PAISE_PER_RUPEE = 100;

const LIMITS = Object.freeze({
  min: 1 * PAISE_PER_RUPEE,
  maxTopUp: 100000 * PAISE_PER_RUPEE,
  maxTransfer: 50000 * PAISE_PER_RUPEE,
});

const formatRupees = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / PAISE_PER_RUPEE);

module.exports = { PAISE_PER_RUPEE, LIMITS, formatRupees };
