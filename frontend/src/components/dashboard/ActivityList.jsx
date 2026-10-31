import { useCallback, useEffect, useState } from 'react';
import { walletApi } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import { dateKey, dayLabel, timeLabel } from '../../utils/date';
import { formatINR } from '../../utils/money';
import { maskPhone } from '../../utils/phone';
import Avatar from '../Avatar';

const FILTERS = [
  ['all', 'All'],
  ['sent', 'Sent'],
  ['received', 'Received'],
  ['topup', 'Added'],
];
const PAGE_SIZE = 15;

function Row({ tx }) {
  const topUp = tx.type === 'topup';
  const outgoing = tx.direction === 'out';
  const title = topUp ? 'Added from bank' : outgoing ? `To ${tx.counterparty?.name ?? 'Unknown'}` : `From ${tx.counterparty?.name ?? 'Unknown'}`;
  const meta = [tx.note, !topUp && maskPhone(tx.counterparty?.phone), timeLabel(new Date(tx.createdAt))].filter(Boolean).join(' · ');

  return (
    <li className="tx">
      <Avatar name={tx.counterparty?.name ?? ''} variant={topUp ? 'bank' : 'person'} size={42} />
      <div className="tx__body">
        <p className="tx__title">{title}</p>
        <p className="tx__meta">{meta}</p>
      </div>
      <p className={`tx__amount ${outgoing ? 'tx__amount--out' : 'tx__amount--in'}`}>
        <span className="sr-only">{outgoing ? 'Sent ' : 'Received '}</span>
        {outgoing ? '−' : '+'}{formatINR(tx.amount)}
      </p>
    </li>
  );
}

export default function ActivityList({ version }) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    walletApi
      .transactions({ type: filter, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setItems(res.data.transactions);
        setCursor(res.data.nextCursor);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setError(errorMessage(err, "Couldn't load your activity."));
        setStatus('error');
      });
    return () => { active = false; };
  }, [filter, version]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await walletApi.transactions({ type: filter, limit: PAGE_SIZE, before: cursor });
      setItems((prev) => [...prev, ...res.data.transactions]);
      setCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load more."));
    } finally {
      setLoadingMore(false);
    }
  }, [filter, cursor]);

  const groups = [];
  for (const tx of items) {
    const when = new Date(tx.createdAt);
    const key = dateKey(when);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(tx);
    else groups.push({ key, label: dayLabel(when), items: [tx] });
  }

  return (
    <section className="activity" aria-labelledby="activity-title">
      <div className="activity__head">
        <h2 id="activity-title" className="panel__title">Activity</h2>
        <div className="chips" role="group" aria-label="Filter activity">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'chip chip--on' : 'chip'} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && (
        <ul className="activity__skeleton" aria-label="Loading activity">
          {[0, 1, 2, 3].map((i) => <li key={i} className="skeleton-row"><span /><span /><span /></li>)}
        </ul>
      )}

      {status === 'error' && <p className="empty" role="alert">{error}</p>}

      {status === 'ready' && items.length === 0 && (
        <p className="empty">
          {filter === 'all' ? 'Nothing here yet. Add some money to get started.' : 'No activity matches this filter.'}
        </p>
      )}

      {status === 'ready' && groups.map((g) => (
        <div key={g.key} className="activity__group">
          <h3 className="activity__day">{g.label}</h3>
          <ul className="activity__list">
            {g.items.map((tx) => <Row key={tx.id} tx={tx} />)}
          </ul>
        </div>
      ))}

      {status === 'ready' && cursor && (
        <button type="button" className="btn btn--outline activity__more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Show older activity'}
        </button>
      )}
    </section>
  );
}
