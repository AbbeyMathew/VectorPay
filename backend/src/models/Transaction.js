const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const transactionSchema = new mongoose.Schema(
  {
    from: { type: ObjectId, ref: 'User', default: null }, // null for top-ups
    to: { type: ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger }, // paise
    type: { type: String, enum: ['transfer', 'topup'], required: true },
    // A row is written as "pending" BEFORE any balance changes, then flipped to
    // "completed" or "failed". A crash mid-transfer therefore leaves a visible,
    // reconcilable record instead of silently missing money.
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    note: { type: String, trim: true, maxlength: 140, default: '' },
  },
  { timestamps: true }
);

// Activity feeds are always "my transactions, newest first".
transactionSchema.index({ from: 1, _id: -1 });
transactionSchema.index({ to: 1, _id: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
