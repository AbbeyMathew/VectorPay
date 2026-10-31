import { useEffect, useId, useRef, useState } from 'react';
import { userApi } from '../../api/endpoints';
import { isCanceled } from '../../api/client';
import { normalizePhone } from '../../utils/phone';
import Avatar from '../Avatar';

/**
 * Phone input that looks the owner up as soon as ten digits are entered,
 * so the sender can confirm WHO they are paying. Reports its state upward:
 * onLookup({ status: 'idle' | 'checking' | 'found' | 'missing' | 'self' | 'error', name })
 */
export default function RecipientField({ value, onChange, onLookup, error }) {
  const id = useId();
  const [state, setState] = useState({ status: 'idle', name: '' });
  const report = useRef(onLookup);
  report.current = onLookup;

  useEffect(() => {
    const digits = normalizePhone(value);
    if (digits.length !== 10) {
      setState({ status: 'idle', name: '' });
      report.current?.({ status: 'idle', name: '' });
      return undefined;
    }

    const controller = new AbortController();
    const checking = { status: 'checking', name: '' };
    setState(checking);
    report.current?.(checking);

    const timer = setTimeout(async () => {
      let next;
      try {
        const res = await userApi.lookup(digits, controller.signal);
        next = res.data.isSelf ? { status: 'self', name: res.data.name } : { status: 'found', name: res.data.name };
      } catch (err) {
        if (isCanceled(err)) return;
        next = { status: err.response?.status === 404 ? 'missing' : 'error', name: '' };
      }
      setState(next);
      report.current?.(next);
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const message =
    error ||
    (state.status === 'missing' && 'No VectorPay account uses this number') ||
    (state.status === 'self' && "That's your own number") ||
    (state.status === 'error' && "Couldn't check this number. Try again.") ||
    '';

  return (
    <div className={`field ${message ? 'field--error' : ''}`}>
      <label htmlFor={id} className="field__label">Recipient's phone number</label>
      <div className="field__control">
        <input
          id={id}
          className="field__input"
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          placeholder="98765 43210"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(message)}
          aria-describedby={`${id}-status`}
        />
      </div>
      <div id={`${id}-status`} className="recipient" aria-live="polite">
        {state.status === 'checking' && <span className="recipient__checking">Checking…</span>}
        {state.status === 'found' && (
          <span className="recipient__found">
            <Avatar name={state.name} size={24} />
            {state.name}
          </span>
        )}
        {message && <span className="field__error">{message}</span>}
      </div>
    </div>
  );
}
