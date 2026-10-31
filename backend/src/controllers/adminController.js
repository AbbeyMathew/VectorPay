const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.stats = asyncHandler(async (req, res) => {
  const [users, held, transfers] = await Promise.all([
    User.countDocuments(),
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Transaction.aggregate([
      { $match: { type: 'transfer', status: 'completed' } },
      { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: '$amount' } } },
    ]),
  ]);

  res.json({
    users,
    totalHeld: held[0]?.total ?? 0,
    transfers: transfers[0]?.count ?? 0,
    transferVolume: transfers[0]?.volume ?? 0,
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  const wallets = await Wallet.find({ user: { $in: users.map((u) => u._id) } }).lean();
  const balanceOf = new Map(wallets.map((w) => [String(w.user), w.balance]));

  res.json({
    users: users.map((u) => ({ ...u.toPublic(), balance: balanceOf.get(String(u._id)) ?? 0 })),
  });
});
