import React, { useEffect, useState } from 'react';
import { getAllUsers } from "../services/adminService";
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import './styles/Admin.css'

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const res = await getAllUsers();
                const data = res?.data?.users ?? res?.data ?? [];
                if (mounted) setUsers(Array.isArray(data) ? data : []);
            } catch (err) {
                const code = err?.response?.status;
                if (code === 401 || code === 403) {
                    navigate("/login");
                } else {
                    setError(err?.response?.data?.message || err.message || "Failed to load users");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [navigate]);

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h2>Admin Dashboard</h2>
            </header>

            <div className="admin-body">
                <aside className="admin-list">
                    {loading && <div className="hint">Loading users…</div>}
                    {error && <div className="error">{error}</div>}
                    {!loading && !users.length && <div className="hint">No users found</div>}

                    <ul>
                        {users.map((u) => (
                            <li
                                key={u._id || u.id || u.email}
                                className={`user-item ${selected && (selected._id === u._id) ? "selected" : ""}`}
                                onClick={() => setSelected(u)}
                            >
                                <div className="user-left">
                                    <div className="user-name">{u.name}</div>
                                    <div className="user-meta">{u.phone || u.email}</div>
                                </div>
                                <div className="user-right">
                                    {u.isAdmin ? <span className="badge admin">ADMIN</span> : <span className="badge">user</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>

                <section className="admin-detail">
                    {!selected && (
                        <div className="placeholder">
                            <p>Select a user to view details</p>
                        </div>
                    )}

                    {selected && (
                        <div className="detail-card">
                            <div className="detail-header">
                                <h3>{selected.name}</h3>
                                {selected.isAdmin ? <span className="badge admin">ADMIN</span> : null}
                            </div>

                            <div className="detail-row"><strong>ID:</strong> <span>{selected._id ?? selected.id}</span></div>
                            <div className="detail-row"><strong>Phone:</strong> <span>{selected.phone ?? "—"}</span></div>
                            <div className="detail-row"><strong>Email:</strong> <span>{selected.email ?? "—"}</span></div>
                            <div className="detail-row"><strong>Created:</strong> <span>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}</span></div>
                            <div className="detail-row"><strong>Updated:</strong> <span>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "—"}</span></div>

                            <div className="detail-actions">
                                <button className="btn" onClick={() => navigator.clipboard?.writeText(selected._id ?? selected.id)}>Copy ID</button>
                                <button className="btn" onClick={() => navigator.clipboard?.writeText(selected.phone)}>Copy Phone</button>
                                <button className="btn muted" onClick={() => setSelected(null)}>Close</button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}