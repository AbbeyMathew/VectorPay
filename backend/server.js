require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const Transaction = require('./models/Transaction');
const auth = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

connectDB(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected.'))
    .catch(err => console.error('MongoDB connection error:', err?.message || err));

app.get('/api/spend/daily', auth, async (req, res) => {
    try {
        const today = new Date();
        const defaultDays = 365;

        let { start, end, tz } = req.query;

        if (!tz || typeof tz !== 'string') tz = '+00:00';
        tz = tz.trim();

        const isIana = tz.includes('/');
        const isOffset = /^[+-](0[0-9]|1[0-4]):[0-5][0-9]$/.test(tz);

        if (!isIana && !isOffset) {
            console.warn('Invalid timezone received, falling back to UTC:', tz);
            tz = '+00:00';
        }

        if (!end) {
            end = today;
        } else {
            end = new Date(end);
            if (isNaN(end)) return res.status(400).json({ error: 'Invalid end date' });
        }

        if (!start) {
            start = new Date(end);
            start.setDate(start.getDate() - (defaultDays - 1));
        } else {
            start = new Date(start);
            if (isNaN(start)) return res.status(400).json({ error: 'Invalid start date' });
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (!req.user || !req.user._id)
            return res.status(401).json({ error: 'Unauthorized' });

        const rawId = req.user._id;
        let userIdObj;

        if (mongoose.isValidObjectId(rawId)) {
            userIdObj =
                typeof rawId === 'object' &&
                    rawId.constructor &&
                    rawId.constructor.name === 'ObjectId'
                    ? rawId
                    : new mongoose.Types.ObjectId(rawId);
        } else {
            console.warn('Invalid req.user._id:', rawId);
            return res.status(500).json({ error: 'Server error' });
        }

        const match = {
            createdAt: { $gte: start, $lte: end },
            from: userIdObj
        };

        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                            timezone: tz
                        }
                    },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const results = await Transaction.aggregate(pipeline);

        const map = {};
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            map[`${y}-${m}-${dd}`] = 0;
        }

        results.forEach(r => { map[r._id] = r.total; });

        return res.json(map);

    } catch (err) {
        console.error('Error in /api/spend/daily:', err?.stack || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err?.stack || err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));