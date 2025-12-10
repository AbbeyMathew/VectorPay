const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

function normalizePhone(phone) {
  return String(phone).replace(/\D/g, '');
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const s = String(email).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidPhone(phone) {
  if (!phone) return false;
  const digits = normalizePhone(phone);
  return /^\d{10}$/.test(digits);
}

function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

exports.register = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password)
      return res.status(400).json({ message: 'Missing fields' });

    if (!isValidEmail(email))
      return res.status(400).json({ message: 'Invalid email format' });

    if (!isValidPhone(phone))
      return res.status(400).json({ message: 'Invalid phone number' });

    if (!isValidPassword(password))
      return res.status(400).json({ message: 'Password must be at least 6 characters and include letters and numbers' });

    const cleanPhone = normalizePhone(phone);
    const cleanEmail = String(email).trim().toLowerCase();

    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone)
      return res.status(400).json({ message: 'Phone already registered' });

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone: cleanPhone,
      email: cleanEmail,
      password: hashed
    });

    try {
      await Wallet.create({
        phone: cleanPhone,
        balance: 0
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const wallet = await Wallet.findOne({ phone: cleanPhone });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        wallet: {
          phone: wallet.phone,
          balance: wallet.balance
        }
      }
    });

  } catch (err) {
    if (err.code === 11000) {
      const key = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${key} already registered` });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password)
      return res.status(400).json({ message: 'Missing phone or password' });

    if (!isValidPhone(phone))
      return res.status(400).json({ message: 'Invalid phone number' });
    
    const cleanPhone = normalizePhone(phone);

    const user = await User.findOne({ phone: cleanPhone }).select('+password +isAdmin');
    if (!user) return res.status(400).json({ message: 'User not found' });

    const payload = { id: user._id, isAdmin: user.isAdmin };

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const wallet = await Wallet.findOne({ phone: cleanPhone });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isAdmin: user.isAdmin,
        wallet: wallet
          ? { phone: wallet.phone, balance: wallet.balance }
          : null
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
};