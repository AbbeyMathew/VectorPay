import React, { useState, useEffect, useRef } from "react";
import { login, requestPasswordReset, verifyOtp } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import OtpInput from "../components/OtpInput";
import img1 from "../assets/carousel_img1.jpg";
import img2 from "../assets/carousel_img2.jpg";
import img3 from "../assets/carousel_img3.jpg";
import img4 from "../assets/carousel_img4.jpg";
import img5 from "../assets/carousel_img5.jpg";
import "./styles/Login.css"
import { setAuthToken } from "../api/axios";

export default function Login() {
    const [form, setForm] = useState({ phone: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [mode, setMode] = useState("login");
    const [recoverEmail, setRecoverEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const resendTimerRef = useRef(null);
    const nav = useNavigate();

    const slides = [
        <img src={img1} alt="slide 1" key="s1" />,
        <img src={img2} alt="slide 2" key="s2" />,
        <img src={img3} alt="slide 3" key="s3" />,
        <img src={img4} alt="slide 4" key="s4" />,
        <img src={img5} alt="slide 5" key="s5" />,
    ];

    useEffect(() => {
        return () => {
            if (resendTimerRef.current) clearInterval(resendTimerRef.current);
        };
    }, []);

    const handleLoginChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const submitLogin = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.phone.trim()) return setError("Phone number required");
        if (!form.password.trim()) return setError("Password required");

        setLoading(true);
        try {
            const r = await login(form);
            const token = r?.data?.token;
            const user = r?.data?.user;

            if (token) {
                localStorage.setItem("token", token);
                setAuthToken(token);
                window.dispatchEvent(new Event("auth:changed"));
            }

            if (user?.isAdmin) {
                nav('/admin');
            } else {
                nav("/dashboard");
            }
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = (seconds = 30) => {
        setResendCooldown(seconds);
        if (resendTimerRef.current) clearInterval(resendTimerRef.current);
        resendTimerRef.current = setInterval(() => {
            setResendCooldown((s) => {
                if (s <= 1) {
                    clearInterval(resendTimerRef.current);
                    resendTimerRef.current = null;
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    };

    const submitRecoverEmail = async (e) => {
        e && e.preventDefault();
        setError("");
        if (!recoverEmail.trim()) return setError("Please enter your email");

        setLoading(true);
        try {
            await requestPasswordReset(recoverEmail);
            startResendCooldown(30);
            setMode("verify-otp");
            setOtp("");
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Unable to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        setError("");
        try {
            await requestPasswordReset(recoverEmail);
            startResendCooldown(30);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Unable to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const submitVerifyOtp = async (e) => {
        e && e.preventDefault();
        setError("");
        if (otp.length < 6) return setError("Enter the 6-digit code");
        setLoading(true);
        try {
            await verifyOtp(recoverEmail, otp);
            nav("/change-password", { state: { email: recoverEmail } });
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const onCancelRecover = () => {
        setMode("login");
        setRecoverEmail("");
        setOtp("");
        setError("");
        if (resendTimerRef.current) { clearInterval(resendTimerRef.current); resendTimerRef.current = null; setResendCooldown(0); }
    };

    return (
        <div className="login-main">
            <div className="login-wrapper">
                <div className="login-card">
                    <h2 className="login-title">
                        {mode === "login" && "Sign in"}
                        {mode === "forgot-password" && "Recover account"}
                        {mode === "verify-otp" && "Enter the OTP"}
                    </h2>

                    {error && <div className="login-error" role="alert">{error}</div>}

                    {mode === "login" && (
                        <form onSubmit={submitLogin} className="login-form" noValidate>
                            <input name="phone" className="login-input hoverable" placeholder="Phone number" value={form.phone} onChange={handleLoginChange} />
                            <input name="password" type="password" className="login-input hoverable" placeholder="Password" value={form.password} onChange={handleLoginChange} />

                            <div className="row between" style={{ marginTop: 6 }}>
                                <button type="button" className="forgot hoverable" onClick={() => setMode("forgot-password")}>Forgot Password?</button>
                            </div>

                            <button className="login-button hoverable" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                        </form>
                    )}

                    {mode === "forgot-password" && (
                        <form onSubmit={submitRecoverEmail} className="login-form" noValidate>
                            <label className="field">
                                <span className="label-text">Email</span>
                                <input className="login-input hoverable" placeholder="your@email.com" value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)} type="email" required />
                            </label>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button type="submit" className="login-button hoverable" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
                                <button type="button" className="login-button hoverable" onClick={onCancelRecover} style={{ background: "#ddd", color: "#222" }}>Cancel</button>
                            </div>
                        </form>
                    )}

                    {mode === "verify-otp" && (
                        <form onSubmit={submitVerifyOtp} className="login-form" noValidate>
                            <div className="field1">
                                <span className="label-text">We sent an OTP to</span>
                                <div style={{ fontWeight: 700 }}>{recoverEmail}</div>
                            </div>

                            <div className="field2">
                                <span className="label-text">OTP</span>
                                <OtpInput length={6} value={otp} onChange={setOtp} autoFocus />
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button type="submit" className="login-button" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
                                <button type="button" className="forgot" onClick={handleResend} disabled={loading || resendCooldown > 0} style={{ marginLeft: 8 }}>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}</button>
                                <button type="button" className="login-button" onClick={onCancelRecover} style={{ marginLeft: "auto", background: "#ddd", color: "#222" }}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="login-right">
                    <Carousel items={slides} interval={5000} speed={500} />
                </div>
            </div>
        </div>
    );
}
