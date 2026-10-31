import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import "./styles/ChangePassword.css";

export default function ChangePassword() {
    const loc = useLocation();
    const nav = useNavigate();
    const initialEmail = loc.state?.email || "";
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) return setError("Email is required");
        if (!password.trim() || password.length < 6) return setError("Password must be at least 6 characters");
        if (password !== confirm) return setError("Passwords do not match");

        setLoading(true);
        try {
            await resetPassword(email, password);
            alert("Password changed. Please sign in with your new password.");
            nav("/login");
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Unable to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper-change">
            <form className="login-card-change" onSubmit={submit}>
                <button type="button" className="back-button-change hoverable" onClick={() => nav("/login")}>&#8592; Go Back</button>

                <h2 className="login-title-change">Change Password</h2>
                {error && <div className="login-error-change">{error}</div>}

                <label className="field-change">
                    <span className="label-text-change">Email</span>
                    <input className="login-input-change hoverable" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </label>

                <label className="field-change">
                    <span className="label-text-change">New password</span>
                    <input className="login-input-change hoverable" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                </label>

                <label className="field-change">
                    <span className="label-text-change">Confirm password</span>
                    <input className="login-input-change hoverable" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
                </label>

                <button type="submit" className="login-button-change hoverable" disabled={loading}>{loading ? "Saving..." : "Change password"}</button>
            </form >
        </div >
    );
}
