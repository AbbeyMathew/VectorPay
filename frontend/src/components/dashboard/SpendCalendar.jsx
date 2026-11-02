import { useEffect, useMemo, useState } from 'react';
import { walletApi } from '../../api/endpoints';
import { dateKey, endOfMonth, startOfMonth } from '../../utils/date';
import { formatINR } from '../../utils/money';
import Icon from '../Icon';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function levelFor(value, max) {
  if (!value || !max) return 0;
  const ratio = value / max;
  return ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
}

export default function SpendCalendar({ version }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [days, setDays] = useState({});
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const range = {
      start: startOfMonth(cursor.year, cursor.month).toISOString(),
      end: endOfMonth(cursor.year, cursor.month).toISOString(),
      tz,
    };
    setStatus('loading');
    walletApi
      .dailySpend(range)
      .then((res) => { if (active) { setDays(res.data.days); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [cursor, version]);

  const go = (delta) => {
    setDays({});
    setSelected(null);
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const first = startOfMonth(cursor.year, cursor.month);
  const daysInMonth = endOfMonth(cursor.year, cursor.month).getDate();
  const leading = (first.getDay() + 6) % 7;
  const values = Object.values(days);
  const max = Math.max(0, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const atCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();
  const monthName = first.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const selectedDate = selected ? new Date(cursor.year, cursor.month, selected) : null;

  return (
    <div className="calendar" aria-busy={status === 'loading'}>
      <div className="calendar__head">
        <div>
          <h2 className="panel__title">Spending calendar</h2>
          <p className="calendar__total">
            {status === 'error' ? "Couldn't load spending" : `${formatINR(total)} sent in ${monthName}`}
          </p>
        </div>
        <div className="calendar__nav">
          <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous month">
            <Icon name="chevron-left" size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={() => go(1)} disabled={atCurrentMonth} aria-label="Next month">
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      </div>

      <div className="calendar__grid" role="grid" aria-label={monthName}>
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday" role="columnheader">{d}</span>
        ))}
        {Array.from({ length: leading }, (_, i) => <span key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(cursor.year, cursor.month, day);
          const key = dateKey(date);
          const value = days[key] || 0;
          const future = date > today;
          const label = `${day} ${first.toLocaleString('en-IN', { month: 'long' })}: ${future ? 'not yet' : value ? `${formatINR(value)} sent` : 'nothing sent'}`;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={future}
              aria-label={label}
              aria-pressed={selected === day}
              className={`day heat-${levelFor(value, max)} ${selected === day ? 'day--selected' : ''} ${key === dateKey(today) ? 'day--today' : ''}`}
              onClick={() => setSelected(selected === day ? null : day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="calendar__foot">
        <p className="calendar__detail" aria-live="polite">
          {selectedDate
            ? `${selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}: ${days[dateKey(selectedDate)] ? formatINR(days[dateKey(selectedDate)]) + ' sent' : 'nothing sent'}`
            : 'Select a day to see what you sent.'}
        </p>
        <div className="legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`heat-${l}`} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
