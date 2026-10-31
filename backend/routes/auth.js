const express = require("express");
const router = express.Router();
const { register, login, requireAuth, requireAdmin } = require("../controllers/authController");
const { sendEmail } = require("../lib/mailer");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/register", register);
router.post("/login", login);
router.post("/admin", requireAuth, requireAdmin);

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const s = String(email).trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 6) return false;
    if (!/[A-Za-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

const otpStore = new Map();

function generateOtp() {
    return (Math.floor(100000 + Math.random() * 900000)).toString();
}

router.post("/forgot", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    if (!isValidEmail(email))
        return res.status(400).json({ message: 'Invalid email format' });

    const code = generateOtp();
    const expiresAt = Date.now() + 1000 * 60 * 10;
    otpStore.set(email, { code, expiresAt, attempts: 0, verified: false });

    console.log(`[OTP] generated for ${email}: ${code}`);

    try {
        const text = `Your VectorPay OTP is ${code}. It expires in 10 minutes.`;
        const html = `<p>Your VectorPay OTP is <strong>${code}</strong>. It expires in 10 minutes.</p>`;
        const info = await sendEmail(email, "Your VectorPay OTP", text, html);
        console.log("[OTP] email sent:", info.messageId);

        return res.json({ ok: true, message: "OTP sent" });
    } catch (err) {
        console.error("[OTP] send failed", err);
        return res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
});

router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Missing params" });

    const entry = otpStore.get(email);
    if (!entry) return res.status(400).json({ message: "No OTP requested for this email" });

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ message: "OTP expired" });
    }

    if (entry.attempts >= 5) {
        otpStore.delete(email);
        return res.status(429).json({ message: "Too many attempts" });
    }

    if (entry.code !== String(otp).trim()) {
        entry.attempts++;
        otpStore.set(email, entry);
        return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.set(email, { ...entry, verified: true, verifiedAt: Date.now() });
    return res.json({ ok: true, message: "OTP verified" });
});

router.post("/reset", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing params" });

    if (!isValidPassword(password))
        return res.status(400).json({ message: 'Password must be at least 6 characters and include letters and numbers' });

    const entry = otpStore.get(email);
    if (!entry || !entry.verified) {
        return res.status(400).json({ message: "OTP not verified or expired" });
    }

    try {
        const cleanEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ message: "User not found" });

        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        await user.save();

        otpStore.delete(email);

        console.log(`[RESET] password updated for ${email}`);
        return res.json({ ok: true, message: "Password updated" });
    } catch (err) {
        console.error("Reset failed", err);
        return res.status(500).json({ message: "Failed to reset password" });
    }
});

module.exports = router;
