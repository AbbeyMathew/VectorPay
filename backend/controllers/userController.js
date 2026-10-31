const User = require('../models/User');

exports.lookupByPhone = async (req, res, next) => {
    try {
        const raw = req.query.phone || '';
        const phone = String(raw).replace(/\D/g, '');
        if (!phone) return res.status(400).json({ message: 'phone required' });

        const user = await User.findOne({ phone }).select('name phone').lean();
        if (!user) return res.status(404).json({ found: false });

        return res.json({ found: true, name: user.name, phone: user.phone });
    } catch (err) {
        next(err);
    }
};
