const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../controllers/authController");

router.get("/users", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
        res.json({ users });
    } catch (err) {
        next(err);
    }
});

module.exports = router;