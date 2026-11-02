import { useState } from 'react';
import TextField from '../TextField';
import RecipientField from './RecipientField';
import Avatar from '../Avatar';
import { walletApi } from '../../api/endpoints';
import { errorMessage, fieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { checkAmount, formatINR, MAX_TOPUP, MAX_TRANSFER } from '../../utils/money';
import { formatPhone, normalizePhone } from '../../utils/phone';

const QUICK_ADD = [50000, 100000, 500000];

const emptySend = { phone: '', amount: '', note: '' };

function SendForm({ balance, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState(emptySend);
  const [recipient, setRecipient] = useState({ status: 'idle', name: '' });
  const [errors, setErrors] = useState({});
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const digits = normalizePhone(form.phone);
  const amount = checkAmount(form.amount, MAX_TRANSFER);

  const review = (e) => {
    e.preventDefault();
    const problems = {};
    if (digits.length !== 10) problems.toPhone = 'Enter a 10-digit phone number';
    else if (recipient.status === 'checking') problems.toPhone = 'Wait while we check this number';
    else if (recipient.status !== 'found') problems.toPhone = 'Choose a number that belongs to a VectorPay account';
    if (amount.error) problems.amount = amount.error;
    else if (balance != null && amount.paise > balance) problems.amount = `You only have ${formatINR(balance)} available`;
    setErrors(problems);
    if (!Object.keys(problems).length) setReviewing(true);
  };

  const send = async () => {
    setBusy(true);
    try {
      await walletApi.transfer({ toPhone: digits, amount: amount.paise, note: form.note.trim() });
      toast.success(`Sent ${formatINR(amount.paise)} to ${recipient.name}`);
      setForm(emptySend);
      setReviewing(false);
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
      setReviewing(false);
    } finally {
      setBusy(false);
    }
  };

  if (reviewing) {
    return (
      <div className="review">
        <h3 className="review__title">Check the details</h3>
        <dl className="review__list">
          <div>
            <dt>To</dt>
            <dd className="review__who">
              <Avatar name={recipient.name} size={32} />
              <span>{recipient.name}<small>{formatPhone(digits)}</small></span>
            </dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd className="review__amount">{formatINR(amount.paise)}</dd>
          </div>
          {form.note.trim() && (
            <div>
              <dt>Note</dt>
              <dd>{form.note.trim()}</dd>
            </div>
          )}
        </dl>
        <div className="review__actions">
          <button type="button" className="btn btn--primary" onClick={send} disabled={busy}>
            {busy ? 'Sending…' : `Send ${formatINR(amount.paise)}`}
          </button>
          <button type="button" className="btn btn--outline" onClick={() => setReviewing(false)} disabled={busy}>Edit</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={review} noValidate className="form">
      <RecipientField value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} onLookup={setRecipient} error={errors.toPhone} />
      <TextField label="Amount" prefix="₹" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={set('amount')} error={errors.amount} />
      <TextField label="Note (optional)" maxLength={140} placeholder="What's it for?" value={form.note} onChange={set('note')} error={errors.note} />
      <button className="btn btn--primary btn--block">Review transfer</button>
    </form>
  );
}

function AddForm({ onDone }) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const result = checkAmount(amount, MAX_TOPUP);
    if (result.error) return setError(result.error);
    setError('');
    setBusy(true);
    try {
      await walletApi.topUp(result.paise);
      toast.success(`Added ${formatINR(result.paise)} to your wallet`);
      setAmount('');
      onDone();
    } catch (err) {
      setError(fieldErrors(err).amount || errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="form">
      <TextField
        label="Amount"
        prefix="₹"
        inputMode="decimal"
        placeholder="0.00"
        hint="Simulated bank transfer. No real account is connected."
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
      />
      <div className="chips" role="group" aria-label="Quick amounts">
        {QUICK_ADD.map((paise) => (
          <button key={paise} type="button" className="chip" onClick={() => { setAmount(String(paise / 100)); setError(''); }}>
            {formatINR(paise).replace('.00', '')}
          </button>
        ))}
      </div>
      <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Adding…' : 'Add money'}</button>
    </form>
  );
}

export default function MoveMoney({ tab, onTabChange, balance, onDone }) {
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Move money">
        {[['send', 'Send money'], ['add', 'Add money']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="move-panel"
            className={tab === id ? 'tab tab--on' : 'tab'}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="move-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="move__body">
        {tab === 'send' ? <SendForm balance={balance} onDone={onDone} /> : <AddForm onDone={onDone} />}
      </div>
    </>
  );
}
