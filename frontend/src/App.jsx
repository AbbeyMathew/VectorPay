import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import MouseCursor from "./components/MouseCursor";
import ProfileButton from "./components/ProfileButton";
import Mainpage from './pages/Mainpage';
import Register from './pages/Register';
import Login from './pages/Login';
import ChangePassword from "./pages/ChangePassword";
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { me } from './services/walletService';
import { setAuthToken } from './api/axios';


export default function App() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);

    const load = async () => {
        try {
            const r = await me();
            setUser(r?.data?.user);
        } catch (e) {
            console.error("load", e);
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        async function checkUser() {
            try {
                const r = await me();
                const user = r.data.user;
                if (user?.isAdmin && window.location.pathname !== '/admin') {
                    navigate('/admin');
                }
            } catch (err) {
                console.warn("Not authenticated");
            }
        }
        checkUser();
    }, []);

    return (
        <>
            <MouseCursor />
            <nav className='navbar navbar-expand-lg navbar-dark bg-dark px-3'>
                <Link className="navbar-brand hoverable" to='/'>
                    <div className='logo'></div>
                    <h3 className='logo-text'>Vector<span style={{ color: '#52B788' }}>Pay</span></h3>
                </Link>

                <div className="collapse navbar-collapse" id="mainNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link hoverable" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link hoverable" to="/login">Login</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link hoverable" to="/register">Register</Link>
                        </li>
                    </ul>
                </div>

                <div className="profile hoverable">
                    <ProfileButton />
                </div>
            </nav>

            <Routes>
                <Route path='/' element={<Mainpage />} />
                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/admin' element={<Admin />} />
            </Routes>
        </>
    );
}