const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const transactionSchema = new mongoose.Schema(
  {
    from: { type: ObjectId, ref: 'User', default: null },
    to: { type: ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    type: { type: String, enum: ['transfer', 'topup'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    note: { type: String, trim: true, maxlength: 140, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ from: 1, _id: -1 });
transactionSchema.index({ to: 1, _id: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
