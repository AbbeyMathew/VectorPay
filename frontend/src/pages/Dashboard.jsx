import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { me, topup, transfer, transactions } from '../services/walletService';
import Heatmap from "../components/Heatmap";
import Avatar from '../components/Avatar';
import instance from '../api/axios';
import './styles/Dashboard.css'

function normalizePhone(p = '') {
    return String(p ?? '').replace(/\D/g, '');
}

function ScrollAmount({ children }) {
    const innerRef = useRef(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [dx, setDx] = useState(0);

    useLayoutEffect(() => {
        const inner = innerRef.current;
        if (!inner) return;

        const parent = inner.parentElement;
        if (!parent) return;

        function measure() {
            const innerW = inner.scrollWidth;
            const parentW = parent.clientWidth;
            const needs = innerW > parentW;
            setShouldAnimate(needs);
            setDx(needs ? innerW - parentW : 0);
        }

        measure();

        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(measure);
            ro.observe(inner);
            ro.observe(parent);
        } else {
            window.addEventListener('resize', measure);
        }

        return () => {
            if (ro) {
                ro.disconnect();
            } else {
                window.removeEventListener('resize', measure);
            }
        };
    }, [children]);

    const style = shouldAnimate ? { ['--scroll-dx']: `${dx}px` } : { ['--scroll-dx']: `0px` };

    return (
        <div
            ref={innerRef}
            className={`scrolltext ${shouldAnimate ? 'animate' : ''}`}
            style={style}
        >
            {children}
        </div>
    );
}

function PhoneWithNameLookup({ value, onChange, className = '', placeholder = 'Recipient Phone' }) {
    const [phone, setPhone] = useState(value || '');
    const [name, setName] = useState(null);
    const [status, setStatus] = useState('idle');
    const debounceRef = useRef(null);
    const controllerRef = useRef(null);

    useEffect(() => {
        setPhone(value || '');
    }, [value]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (controllerRef.current) controllerRef.current.abort();
        };
    }, []);

    const fetchNameForPhone = async (p) => {
        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();
        setStatus('checking');
        setName(null);

        try {
            const res = await instance.get('/users/lookup', { params: { phone: p } });
            const json = res.data;
            if (json && (json.found || json.name)) {
                setName(json.name || json.fullName || 'Unknown');
                setStatus('found');
            } else {
                setName(null);
                setStatus('not-found');
            }
        } catch (err) {
            console.error('lookup error', err);
            setName(null);
            setStatus(err?.response?.status === 404 ? 'not-found' : 'error');
        }
    };

    const handleChange = (e) => {
        const v = e.target.value;
        setPhone(v);
        if (onChange) onChange(v);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        const cleaned = v.trim();
        if (!cleaned || cleaned.length < 4) {
            setName(null);
            setStatus('idle');
            return;
        }

        debounceRef.current = setTimeout(() => {
            const digits = normalizePhone(cleaned);
            fetchNameForPhone(digits);
        }, 300);
    };

    const badgeText = status === 'checking' ? 'Checking…' :
        status === 'found' ? name :
            status === 'not-found' ? 'Not found' :
                status === 'error' ? 'Error' : 'Guest';

    return (
        <div className={`phone-with-name ${className}`}>
            <div className="input-and-badge">
                <input
                    type="text"
                    inputMode="tel"
                    value={phone}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="phone-input hoverable"
                    aria-describedby="phoneLookupStatus"
                />
                <div
                    className={`name-badge ${status}`}
                    id="phoneLookupStatus"
                    aria-live="polite"
                >
                    {badgeText}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [amt, setAmt] = useState('');
    const [amtS, setAmtS] = useState('');
    const [to, setTo] = useState('');
    const [note, setNote] = useState('');
    const [txs, setTxs] = useState([]);

    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')); }
        catch (e) { return null; }
    })();

    const currentUserPhone = normalizePhone(user?.phone ?? storedUser?.phone ?? '');

    const load = async () => {
        try {
            const r = await me();
            setUser(r.data.user);
            const t = await transactions();
            setTxs(t.data.transactions);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const doTopup = async e => {
        e.preventDefault();
        try {
            await topup(Number(amtS));
            setAmtS('');
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message)
        }
    };

    const doTransfer = async e => {
        e.preventDefault();
        try {
            await transfer({ toPhone: to, amount: Number(amt), note });
            setTo('');
            setAmt('');
            setNote('');
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message)
        }
    };

    return (
        <div className='dash-wrapper'>
            <h2>Dashboard</h2>

            <div className="dash-contents">
                <div className="dash-top">
                    <div className="dash-details">
                        <div className="dash-details-left">
                            <div><span>Name:</span> {user?.name ?? 'Guest'}</div>
                            <div><span>Phone:</span> {user?.phone ?? '0000000000'}</div>
                            <div><span>Email:</span> {user?.email ?? 'guestmail@vector.com'}</div>
                            <div className='dash-balance'><span>Balance:</span> {user?.wallet?.balance ?? 0}</div>
                        </div>
                        <Avatar name={user?.name} size={110} />
                    </div>
                    <div id="container-d">
                        <div id="panel-d">
                            <div id="panel-container-d">
                                <div className="glow-d"></div>
                                <div className="panel-content-d">
                                    <div className="card-brand-d"></div>
                                    <div className="card-chip-d" />
                                    <div className="card-number-d">1234  ••••  ••••  5678</div>
                                    <div className="card-row-d">
                                        <div className="card-label-d">Developed By</div>
                                        <div className="card-label-d">Completed On</div>
                                    </div>
                                    <div className="card-row-d">
                                        <div className="card-value-d">Abbey Mathew</div>
                                        <div className="card-value-d">11/25</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dash-bottom">
                    <div className="dash-form">
                        <form onSubmit={doTopup}>
                            <h3>Bank Transfer (To Self)</h3>
                            <input className='hoverable' placeholder='Amount' value={amtS} onChange={e => setAmtS(e.target.value)} />
                            <button className='hoverable'>Top up</button>
                        </form>

                        <form onSubmit={doTransfer}>
                            <h3>Wallet Transfer (P2P)</h3>
                            <PhoneWithNameLookup value={to} onChange={setTo} />
                            <input className='hoverable' placeholder='Amount' value={amt} onChange={e => setAmt(e.target.value)} />
                            <input className='hoverable' placeholder='Note' value={note} onChange={e => setNote(e.target.value)} />
                            <button className='hoverable'>Send</button>
                        </form>
                    </div>
                    <div className="dash-heatmap">
                        <Heatmap endpoint="/spend/daily" />
                    </div>
                </div>
            </div>

            <div className="vert-line"></div>

            <div className="transaction-section">
                <h3>Transactions</h3>

                <ul>
                    {txs.map(tx => {
                        const getId = u => {
                            if (!u) return '';
                            if (typeof u === 'string') return u;
                            return String(u._id ?? u.id ?? '');
                        };

                        const fromId = getId(tx.from);
                        const toId = getId(tx.to);

                        const fromPhone = normalizePhone(tx.from?.phone ?? tx.from?.phoneNumber ?? '');
                        const toPhone = normalizePhone(tx.to?.phone ?? tx.to?.phoneNumber ?? '');

                        const stored = (() => {
                            try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return {}; }
                        })();
                        const currentUserId = String(user?._id ?? user?.id ?? stored?._id ?? stored?.id ?? '');
                        const currentPhone = normalizePhone(user?.phone ?? stored?.phone ?? '');

                        const isSender = currentUserId ? (fromId && fromId === currentUserId) : (fromPhone && fromPhone === currentPhone);
                        const isReceiver = currentUserId ? (toId && toId === currentUserId) : (toPhone && toPhone === currentPhone);

                        const fromName = (typeof tx.from === 'object' && tx.from?.name) ? tx.from.name : (typeof tx.from === 'string' ? tx.from : '');
                        const toName = (typeof tx.to === 'object' && tx.to?.name) ? tx.to.name : (typeof tx.to === 'string' ? tx.to : '');

                        return (
                            <li key={tx.id ?? tx._id}>
                                <div className="txs-left">
                                    <div className="txs-avatar-wrap">
                                        {isSender && <Avatar name={toName || 'system'} size={55} />}
                                        {isReceiver && <Avatar name={fromName || 'system'} size={55} />}

                                        {!isSender && !isReceiver && (
                                            <>
                                                <Avatar name={fromName || 'system'} size={55} />
                                                <Avatar name={toName || 'system'} size={55} />
                                            </>
                                        )}
                                    </div>

                                    <div className="txs-details">
                                        <div className="txs-to-from">
                                            {isSender &&
                                                <div> {tx.to?.name ?? tx.to ?? 'system'} <span>{tx.to?.phone ? `(Phone: ${tx.to.phone})` : ''}</span> </div>
                                            }
                                            {isReceiver &&
                                                <div> {tx.from?.name ?? tx.from ?? 'system'} <span>{tx.from?.phone ? `(Phone: ${tx.from.phone})` : ''}</span> </div>
                                            }
                                            {!isSender && !isReceiver && (
                                                <>
                                                    <div>{tx.from?.name ?? tx.from ?? 'system'} <span>{tx.from?.phone ? `(Phone: ${tx.from.phone})` : ''}</span></div>
                                                    <div>{tx.to?.name ?? tx.to ?? 'system'} <span>{tx.to?.phone ? `(Phone: ${tx.to.phone})` : ''}</span></div>
                                                </>
                                            )}
                                        </div>

                                        <div className="txs-type-time">
                                            <div className="txs-type">(Type: {tx.type}</div>
                                            |
                                            <div className="txs-time">
                                                {new Date(tx.createdAt ?? tx.created_at).toLocaleString()})
                                            </div>
                                        </div>

                                        {tx.note && <div className='txs-title'>Note: {tx.note}</div>}
                                    </div>
                                </div>

                                <div className="txs-right">
                                    <div className={isSender ? "txs-amount amount-sent" : isReceiver ? "txs-amount amount-received" : "txs-amount amount-neutral"}>
                                        <ScrollAmount>
                                            {isSender ? `-₹${tx.amount}` : isReceiver ? `+₹${tx.amount}` : tx.amount}
                                        </ScrollAmount>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}