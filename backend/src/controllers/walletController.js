const asyncHandler = require('../utils/asyncHandler');
const walletService = require('../services/walletService');

exports.getWallet = asyncHandler(async (req, res) => {
  res.json({ wallet: await walletService.getWallet(req.user._id) });
});

exports.topUp = asyncHandler(async (req, res) => {
  res.status(201).json({ wallet: await walletService.topUp(req.user._id, req.body.amount) });
});

exports.transfer = asyncHandler(async (req, res) => {
  const { toPhone, amount, note } = req.body;
  const result = await walletService.transfer({ senderId: req.user._id, toPhone, amount, note });
  res.status(201).json(result);
});

exports.listTransactions = asyncHandler(async (req, res) => {
  res.json(await walletService.listTransactions(req.user._id, req.query));
});

exports.dailySpend = asyncHandler(async (req, res) => {
  res.json({ days: await walletService.dailySpend(req.user._id, req.query) });
});

exports.summary = asyncHandler(async (req, res) => {
  res.json(await walletService.periodSummary(req.user._id, req.query));
});
