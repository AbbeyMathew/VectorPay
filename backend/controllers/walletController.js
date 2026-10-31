const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await Wallet.findOne({ phone: user.phone });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        wallet: wallet
          ? {
            phone: wallet.phone,
            balance: wallet.balance
          }
          : null
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.topup = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const wallet = await Wallet.findOne({ phone: req.user.phone });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({ from: null, to: req.user._id, amount, type: 'topup', note: 'Top up' });

    res.json({ wallet: { phone: wallet.phone, balance: wallet.balance } });
  } catch (err) {
    next(err);
  }
};

exports.transfer = async (req, res, next) => {
  try {
    const { toPhone, amount, note } = req.body;
    const transferAmount = Number(amount);

    if (!toPhone || !transferAmount || transferAmount <= 0)
      return res.status(400).json({ message: 'Invalid input' });

    if (req.user.phone === toPhone)
      return res.status(400).json({ message: 'Cannot transfer to self' });

    const recipientUser = await User.findOne({ phone: toPhone });
    if (!recipientUser) return res.status(404).json({ message: 'Recipient not found' });

    const senderWallet = await Wallet.findOneAndUpdate(
      { phone: req.user.phone, balance: { $gte: transferAmount } }, 
      { $inc: { balance: -transferAmount } },                       
      { new: true }                                                 
    );

    if (!senderWallet) {
      return res.status(400).json({ message: 'Insufficient funds or wallet not found' });
    }

    const recipientWallet = await Wallet.findOneAndUpdate(
      { phone: toPhone },
      { $inc: { balance: transferAmount } },
      { new: true }
    );

    if (!recipientWallet) {
      await Wallet.findOneAndUpdate(
        { phone: req.user.phone },
        { $inc: { balance: transferAmount } }
      );
      return res.status(500).json({ message: 'Recipient wallet not found — rolled back' });
    }

    await Transaction.create({
      from: req.user._id,
      to: recipientUser._id,
      amount: transferAmount,
      type: 'transfer',
      note: note || ''
    });

    res.json({ wallet: { phone: senderWallet.phone, balance: senderWallet.balance } });
  } catch (err) {
    next(err);
  }
};


exports.transactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
      .populate('from', 'name phone')
      .populate('to', 'name phone')
      .sort({ createdAt: -1 });

    const out = txs.map(tx => ({
      id: tx._id,
      amount: tx.amount,
      type: tx.type,
      note: tx.note,
      createdAt: tx.createdAt,
      from: tx.from ? { id: tx.from._id, name: tx.from.name, phone: tx.from.phone } : null,
      to: tx.to ? { id: tx.to._id, name: tx.to.name, phone: tx.to.phone } : null
    }));

    res.json({ transactions: out });
  } catch (err) {
    next(err);
  }
};
