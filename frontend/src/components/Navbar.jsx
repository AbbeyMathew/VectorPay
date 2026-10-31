import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import Logo from './Logo';
import Avatar from './Avatar';
import Icon from './Icon';

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="usermenu" ref={ref}>
      <button
        type="button"
        className="usermenu__button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar name={user.name} size={30} />
        <span className="usermenu__name">{user.name.split(' ')[0]}</span>
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <div className="usermenu__panel">
          <div className="usermenu__who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="usermenu__item" onClick={handleSignOut}>
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, status } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo to={user ? homePathFor(user) : '/'} />

        <nav className="navbar__nav" aria-label="Main">
          {user && (
            <>
              {!user.isAdmin && <NavLink to="/dashboard" className="navbar__link">Overview</NavLink>}
              {user.isAdmin && <NavLink to="/admin" className="navbar__link">Admin</NavLink>}
              {user.isAdmin && <NavLink to="/dashboard" className="navbar__link">My wallet</NavLink>}
            </>
          )}
        </nav>

        <div className="navbar__actions">
          {status === 'ready' && user && <UserMenu />}
          {status === 'ready' && !user && (
            <>
              <Link to="/login" className="btn btn--text">Sign in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
