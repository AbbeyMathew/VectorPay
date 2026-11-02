const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const args = new Set(process.argv.slice(2));
const DEMO_PASSWORD = 'Demo@1234';
const DAY = 24 * 60 * 60 * 1000;
const rupees = (n) => n * 100;

const DEMO_USERS = [
  { name: 'Aarav Menon', phone: '9876543210', email: 'aarav@vectorpay.test' },
  { name: 'Diya Nair', phone: '9876543211', email: 'diya@vectorpay.test' },
  { name: 'Kabir Thomas', phone: '9876543212', email: 'kabir@vectorpay.test' },
];

const TOPUPS = [
  [[72, 15000], [49, 9000], [27, 12000], [9, 8000]],
  [[68, 10000], [41, 7000], [18, 9000]],
  [[61, 6000], [30, 8000], [5, 5000]],
];
const NOTES = ['Dinner', 'Rent share', 'Movie night', 'Groceries', 'Cab fare', 'Birthday gift', 'Coffee', 'Trip split', 'Lunch', 'Chai'];
const AMOUNTS = [60, 150, 240, 480, 650, 900, 1200, 2000, 3500];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function createAccount({ name, phone, email, password, isAdmin = false }) {
  const existing = await User.findOne({ phone });
  if (existing) return { user: existing, created: false };
  const user = await User.create({ name, phone, email, isAdmin, password: await bcrypt.hash(password, 12) });
  await Wallet.create({ user: user._id });
  return { user, created: true };
}

function buildHistory(users) {
  const rand = mulberry32(20251125);
  const now = Date.now();
  const events = [];

  TOPUPS.forEach((list, i) => list.forEach(([daysAgo, amt]) => {
    events.push({ ts: now - daysAgo * DAY + Math.floor(rand() * 6 * 3600e3), type: 'topup', to: i, amount: rupees(amt), note: 'Added from bank' });
  }));

  for (let d = 70; d >= 0; d--) {
    const count = rand() < 0.45 ? 1 + Math.floor(rand() * 2) : 0;
    for (let k = 0; k < count; k++) {
      const from = Math.floor(rand() * users.length);
      const to = (from + 1 + Math.floor(rand() * (users.length - 1))) % users.length;
      events.push({
        ts: now - d * DAY - Math.floor(rand() * 10 * 3600e3),
        type: 'transfer', from, to,
        amount: rupees(AMOUNTS[Math.floor(rand() * AMOUNTS.length)]),
        note: NOTES[Math.floor(rand() * NOTES.length)],
      });
    }
  }

  events.sort((a, b) => a.ts - b.ts);

  
  const balances = users.map(() => 0);
  const rows = [];
  let lastSecond = 0;
  for (const e of events) {
    if (e.type === 'topup') balances[e.to] += e.amount;
    else if (balances[e.from] >= e.amount) { balances[e.from] -= e.amount; balances[e.to] += e.amount; }
    else continue;

    const second = Math.max(Math.floor(e.ts / 1000), lastSecond + 1);
    lastSecond = second;
    const at = new Date(second * 1000);
    rows.push({
      _id: mongoose.Types.ObjectId.createFromTime(second),
      from: e.type === 'transfer' ? users[e.from]._id : null,
      to: users[e.to]._id,
      amount: e.amount, type: e.type, status: 'completed', note: e.note,
      createdAt: at, updatedAt: at, __v: 0,
    });
  }
  return { rows, balances };
}

async function main() {
  if (!env.mongoUri) throw new Error('MONGO_URI is not set');
  if (env.isProd && args.has('--reset')) throw new Error('--reset is blocked in production');
  if (env.isProd && !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_PASSWORD when seeding in production');

  await connectDB(env.mongoUri);

  if (args.has('--reset')) {
    await Promise.all([User.deleteMany({}), Wallet.deleteMany({}), Transaction.deleteMany({})]);
    console.log('Existing data removed');
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const admin = await createAccount({
    name: 'VectorPay Admin',
    phone: process.env.ADMIN_PHONE || '9000000000',
    email: process.env.ADMIN_EMAIL || 'admin@vectorpay.test',
    password: adminPassword,
    isAdmin: true,
  });
  console.log(admin.created ? 'Admin created' : 'Admin already exists (unchanged)');

  if (args.has('--demo')) {
    const accounts = [];
    for (const u of DEMO_USERS) accounts.push(await createAccount({ ...u, password: DEMO_PASSWORD }));

    if (accounts.every((a) => a.created)) {
      const users = accounts.map((a) => a.user);
      const { rows, balances } = buildHistory(users);
      await Transaction.collection.insertMany(rows);
      await Promise.all(users.map((u, i) => Wallet.updateOne({ user: u._id }, { balance: balances[i] })));
      console.log(`Demo data created: ${users.length} users, ${rows.length} transactions`);
    } else {
      console.log('Demo users already exist. Re-run with --reset to rebuild.');
    }
  }

  console.log('\nSign-in details');
  console.log(`  Admin  ${process.env.ADMIN_PHONE || '9000000000'}  /  ${admin.created ? adminPassword : '(unchanged)'}`);
  if (args.has('--demo')) DEMO_USERS.forEach((u) => console.log(`  ${u.name.padEnd(13)} ${u.phone}  /  ${DEMO_PASSWORD}`));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
