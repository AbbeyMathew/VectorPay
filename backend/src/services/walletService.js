const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const HttpError = require('../utils/httpError');
const { safeTimeZone } = require('../utils/timezone');

async function getWallet(userId) {
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) throw new HttpError(404, 'Wallet not found');
  return { balance: wallet.balance, currency: wallet.currency };
}

async function topUp(userId, amount) {
  const tx = await Transaction.create({
    to: userId,
    amount,
    type: 'topup',
    note: 'Added from bank',
    status: 'pending',
  });

  const wallet = await Wallet.findOneAndUpdate({ user: userId }, { $inc: { balance: amount } }, { new: true });
  if (!wallet) {
    await Transaction.updateOne({ _id: tx._id }, { status: 'failed' });
    throw new HttpError(404, 'Wallet not found');
  }

  await Transaction.updateOne({ _id: tx._id }, { status: 'completed' });
  return { balance: wallet.balance, currency: wallet.currency };
}

async function transfer({ senderId, toPhone, amount, note }) {
  const recipient = await User.findOne({ phone: toPhone }).select('name phone');
  if (!recipient) throw new HttpError(404, 'No VectorPay account uses that phone number', { toPhone: 'No account found' });
  if (recipient._id.equals(senderId)) throw new HttpError(400, "You can't send money to yourself", { toPhone: "That's your own number" });

  const canAfford = await Wallet.exists({ user: senderId, balance: { $gte: amount } });
  if (!canAfford) throw new HttpError(400, 'Not enough balance for this transfer', { amount: 'Not enough balance' });

  const tx = await Transaction.create({
    from: senderId,
    to: recipient._id,
    amount,
    type: 'transfer',
    note,
    status: 'pending',
  });

  const debited = await Wallet.findOneAndUpdate(
    { user: senderId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!debited) {
    await Transaction.updateOne({ _id: tx._id }, { status: 'failed' });
    throw new HttpError(400, 'Not enough balance for this transfer', { amount: 'Not enough balance' });
  }

  try {
    const credited = await Wallet.findOneAndUpdate({ user: recipient._id }, { $inc: { balance: amount } });
    if (!credited) throw new Error('Recipient wallet is missing');
  } catch (err) {
    console.error('Transfer credit failed, refunding sender:', err.message);
    await Wallet.updateOne({ user: senderId }, { $inc: { balance: amount } });
    await Transaction.updateOne({ _id: tx._id }, { status: 'failed' });
    throw new HttpError(500, 'The transfer failed and your money was returned. Please try again.');
  }

  await Transaction.updateOne({ _id: tx._id }, { status: 'completed' });

  return {
    balance: debited.balance,
    currency: debited.currency,
    transaction: { id: tx._id, amount, to: { name: recipient.name, phone: recipient.phone } },
  };
}

async function listTransactions(userId, { limit, before, type }) {
  const filter = { status: 'completed' };
  if (type === 'sent') Object.assign(filter, { from: userId, type: 'transfer' });
  else if (type === 'received') Object.assign(filter, { to: userId, type: 'transfer' });
  else if (type === 'topup') Object.assign(filter, { to: userId, type: 'topup' });
  else filter.$or = [{ from: userId }, { to: userId }];
  if (before) filter._id = { $lt: before };

  const rows = await Transaction.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('from', 'name phone')
    .populate('to', 'name phone')
    .lean();

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const me = String(userId);

  const transactions = page.map((tx) => {
    const outgoing = tx.from && String(tx.from._id) === me;
    const other = outgoing ? tx.to : tx.from;
    return {
      id: tx._id,
      type: tx.type,
      direction: outgoing ? 'out' : 'in',
      amount: tx.amount,
      note: tx.note,
      createdAt: tx.createdAt,
      counterparty: other ? { id: other._id, name: other.name, phone: other.phone } : null,
    };
  });

  return { transactions, nextCursor: hasMore ? String(page[page.length - 1]._id) : null };
}

async function dailySpend(userId, { start, end, tz }) {
  const rows = await Transaction.aggregate([
    { $match: { from: userId, type: 'transfer', status: 'completed', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: safeTimeZone(tz) } },
        total: { $sum: '$amount' },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.total]));
}

async function periodSummary(userId, { start, end }) {
  const range = { $gte: start, $lte: end };
  const sum = (match) =>
    Transaction.aggregate([
      { $match: { type: 'transfer', status: 'completed', createdAt: range, ...match } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total ?? 0);

  const [sent, received] = await Promise.all([sum({ from: userId }), sum({ to: userId })]);
  return { sent, received };
}

module.exports = { getWallet, topUp, transfer, listTransactions, dailySpend, periodSummary };
