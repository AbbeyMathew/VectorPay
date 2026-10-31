import { greeting } from '../../utils/date';
import { formatINR, splitINR } from '../../utils/money';
import Icon from '../Icon';

export default function BalanceBand({ name, wallet, summary, onSend, onAdd }) {
  const loaded = Boolean(wallet);
  const [whole, paise] = loaded ? splitINR(wallet.balance) : ['₹—', ''];

  return (
    <section className="balance" aria-labelledby="balance-heading">
      <svg className="balance__lines" viewBox="0 0 600 260" aria-hidden="true" preserveAspectRatio="xMaxYMid slice">
        <path d="M120 270 C 260 230, 360 120, 620 40" />
        <path d="M220 290 C 360 250, 450 170, 640 120" />
        <circle cx="620" cy="40" r="5" />
      </svg>

      <div className="balance__main">
        <p className="balance__hello">{greeting()}, {name.split(' ')[0]}</p>
        <h2 id="balance-heading" className="balance__label">Available balance</h2>
        <p className="balance__amount" aria-live="polite">
          {whole}
          {paise && <span className="balance__paise">.{paise}</span>}
        </p>

        <div className="balance__actions">
          <button type="button" className="btn btn--light" onClick={onSend}>
            <Icon name="arrow-up-right" size={18} /> Send money
          </button>
          <button type="button" className="btn btn--glass" onClick={onAdd}>
            <Icon name="plus" size={18} /> Add money
          </button>
        </div>
      </div>

      <dl className="balance__stats">
        <div>
          <dt>Sent this month</dt>
          <dd>{loaded ? formatINR(summary.sent) : '—'}</dd>
        </div>
        <div>
          <dt>Received this month</dt>
          <dd>{loaded ? formatINR(summary.received) : '—'}</dd>
        </div>
      </dl>
    </section>
  );
}
