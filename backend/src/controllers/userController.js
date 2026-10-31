const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/** Lets the sender confirm WHO they're paying before any money moves. Sign-in required. */
exports.lookupByPhone = asyncHandler(async (req, res) => {
  const user = await User.findOne({ phone: req.query.phone }).select('name').lean();
  if (!user) return res.status(404).json({ found: false });
  res.json({ found: true, name: user.name, isSelf: String(user._id) === String(req.user._id) });
});
