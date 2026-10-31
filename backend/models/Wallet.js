const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    phone: {type: Number, required: true, unique: true},
    balance: { type: Number, default: 0 },
}, { timestamps: true });

walletSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);
