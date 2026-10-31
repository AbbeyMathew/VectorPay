const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Integer paise. The ">= 0" guarantee is enforced atomically in services/walletService.js.
    balance: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
