const { z } = require('zod');
const mongoose = require('mongoose');
const { normalizePhone, isValidPhone } = require('../utils/phone');
const { LIMITS, formatRupees } = require('../utils/money');

const phone = z
  .string({ required_error: 'Enter your phone number' })
  .transform(normalizePhone)
  .refine(isValidPhone, 'Enter a 10-digit phone number');

const email = z
  .string({ required_error: 'Enter your email address' })
  .trim()
  .toLowerCase()
  .max(120, 'Email is too long')
  .email('Enter a valid email address');

const password = z
  .string({ required_error: 'Enter a password' })
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

const amountPaise = (max) =>
  z
    .number({ required_error: 'Enter an amount', invalid_type_error: 'Enter a valid amount' })
    .int('Enter a valid amount')
    .min(LIMITS.min, `The minimum is ${formatRupees(LIMITS.min)}`)
    .max(max, `The maximum is ${formatRupees(max)}`);

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid id');

const dateRange = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    tz: z.string().max(64).optional(),
  })
  .refine((v) => v.end > v.start, { message: 'end must be after start', path: ['end'] })
  .refine((v) => v.end - v.start <= 366 * 24 * 60 * 60 * 1000, {
    message: 'Date range cannot exceed one year',
    path: ['end'],
  });

module.exports = {
  registerSchema: z.object({
    name: z.string({ required_error: 'Enter your name' }).trim().min(2, 'Enter your full name').max(60),
    phone,
    email,
    password,
  }),
  loginSchema: z.object({
    phone,
    password: z.string({ required_error: 'Enter your password' }).min(1, 'Enter your password'),
  }),
  forgotSchema: z.object({ email }),
  verifyOtpSchema: z.object({
    email,
    otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  }),
  resetSchema: z.object({ resetToken: z.string().min(10), password }),

  topUpSchema: z.object({ amount: amountPaise(LIMITS.maxTopUp) }),
  transferSchema: z.object({
    toPhone: phone,
    amount: amountPaise(LIMITS.maxTransfer),
    note: z.string().trim().max(140, 'Keep the note under 140 characters').optional().default(''),
  }),
  transactionsQuerySchema: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    before: objectId.optional(),
    type: z.enum(['all', 'sent', 'received', 'topup']).default('all'),
  }),
  dateRangeSchema: dateRange,
  lookupQuerySchema: z.object({ phone }),
  adminUsersQuerySchema: z.object({ search: z.string().trim().max(60).optional().default('') }),
};
