import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { me } from "../services/walletService";
import instance from "../api/axios";
import "./ProfileButton.css";

export default function ProfileButton() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    const ref = useRef(null);
    const navigate = useNavigate();

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const looksLikeRealUser = (d) => Boolean(d && (d.id || d._id || d.email || d.phone));
    const signedIn = Boolean(token && looksLikeRealUser(user));

    function getIsAdmin() {
        if (user && typeof user.isAdmin !== "undefined") return Boolean(user.isAdmin);
        try {
            const t = localStorage.getItem("token");
            if (!t) return false;
            const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return Boolean(payload?.isAdmin);
        } catch (e) {
            return false;
        }
    }

    async function fetchMe() {
        try {
            const res = await instance.get("/wallet/me");
            const data = res?.data?.user ?? res?.data ?? null;
            if (looksLikeRealUser(data)) setUser(data);
            else setUser(null);
        } catch (err) {
            setUser(null);
        }
    }

    useEffect(() => {
        fetchMe();

        function onAuthChanged() {
            fetchMe();
        }
        window.addEventListener("auth:changed", onAuthChanged);

        return () => {
            window.removeEventListener("auth:changed", onAuthChanged);
        };
    }, []);

    useEffect(() => {
        function onDocClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    function signOut() {
        try { 
            localStorage.removeItem("token"); 
        } catch (e) { 
            //pass 
        }
        try {
            delete instance.defaults.headers.common["Authorization"];
        } catch (e) { }
        setUser(null);
        window.dispatchEvent(new Event("auth:changed"));
        navigate("/login");
    }

    const displayName = signedIn ? user?.name ?? "User" : "Guest";

    return (
        <div className="profile-root" ref={ref}>
            <button
                className="profile-pill hoverable"
                onClick={() => setOpen((s) => !s)}
                aria-haspopup="true"
                aria-expanded={open}
            >
                {signedIn ? (
                    <>
                        <span className="welcome-text">Welcome, {displayName}</span>
                        <span className="pill-avatar">
                            <Avatar name={user?.name || 'Guest'} size={28} />
                        </span>
                    </>
                ) : (
                    <>
                        <span className="welcome-text">Welcome, Guest</span>
                        <span className="pill-avatar" aria-hidden="true">
                            <Avatar src={null} size={28} />
                        </span>
                    </>
                )}
            </button>

            {open && (
                <div className="profile-panel" role="menu">
                    {signedIn ? (
                        <>
                            <div className="panel-top">
                                <Avatar name={user?.name || 'Guest'} size={56} />
                                <div className="panel-meta">
                                    <div className="panel-name">{displayName}</div>
                                    <a
                                        className="panel-link hoverable"
                                        href={ getIsAdmin() ? "/admin" : "/dashboard" }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setOpen(false);
                                            navigate(getIsAdmin() ? "/admin" : "/dashboard");
                                        }}
                                    >
                                        View Profile
                                    </a>
                                </div>
                            </div>

                            <div className="panel-actions">
                                <button
                                    className="panel-item signout"
                                    onClick={() => {
                                        setOpen(false);
                                        signOut();
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="panel-actions">
                            <button
                                className="panel-item"
                                onClick={() => {
                                    setOpen(false);
                                    navigate("/login");
                                }}
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}