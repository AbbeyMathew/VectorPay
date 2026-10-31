import { useEffect, useState } from 'react';
import { adminApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import useDebounce from '../hooks/useDebounce';
import Avatar from '../components/Avatar';
import { formatINR } from '../utils/money';
import { formatPhone } from '../utils/phone';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim(), 300);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    adminApi
      .users(query)
      .then((res) => { if (active) { setUsers(res.data.users); setStatus('ready'); } })
      .catch((err) => { if (active) { setError(errorMessage(err, "Couldn't load users.")); setStatus('error'); } });
    return () => { active = false; };
  }, [query]);

  const figures = [
    ['Accounts', stats ? stats.users.toLocaleString('en-IN') : '—'],
    ['Held in wallets', stats ? formatINR(stats.totalHeld) : '—'],
    ['Transfers', stats ? stats.transfers.toLocaleString('en-IN') : '—'],
    ['Transfer volume', stats ? formatINR(stats.transferVolume) : '—'],
  ];

  return (
    <div className="container admin">
      <h1 className="admin__title">Admin</h1>

      <dl className="figures">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="admin__bar">
        <h2 className="panel__title">Accounts</h2>
        <label className="admin__search">
          <span className="sr-only">Search accounts</span>
          <input type="search" placeholder="Search by name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      {status === 'error' && <p className="empty" role="alert">{error}</p>}

      {status !== 'error' && (
        <div className="table-wrap" role="region" aria-label="Accounts table" tabIndex={0}>
          <table className="table" aria-busy={status === 'loading'}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col" className="table__num">Balance</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="table__name">
                      <Avatar name={u.name} size={32} />
                      {u.name}
                      {u.isAdmin && <span className="badge">Admin</span>}
                    </span>
                  </td>
                  <td>{formatPhone(u.phone)}</td>
                  <td>{u.email}</td>
                  <td className="table__num">{formatINR(u.balance)}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {status === 'ready' && users.length === 0 && <p className="empty">No accounts match "{query}".</p>}
        </div>
      )}
    </div>
  );
}
