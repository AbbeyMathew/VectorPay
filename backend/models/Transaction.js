const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['transfer','topup'], required: true },
  note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', txSchema);
