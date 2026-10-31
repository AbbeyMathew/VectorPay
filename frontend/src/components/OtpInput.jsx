import { useEffect, useRef } from 'react';

/** Six single-digit boxes that behave like one field: typing, pasting, SMS autofill and backspace all work. */
export default function OtpInput({ length = 6, value, onChange, onComplete, disabled = false, invalid = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const focus = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (index, event) => {
    // Digits can only be added next to existing ones, so never skip ahead of what's filled in.
    const slot = Math.min(index, value.length);
    let typed = event.target.value.replace(/\D/g, '');

    if (!typed) {
      commit(value.slice(0, slot) + value.slice(slot + 1)); // box was cleared
      return;
    }
    if (digits[slot] && typed.length === 2) typed = typed.slice(-1); // typed over an existing digit
    const tail = typed.length === 1 ? value.slice(slot + 1) : ''; // multiple digits = paste/autofill
    commit(value.slice(0, slot) + typed + tail);
    focus(slot + typed.length);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      commit(value.slice(0, index - 1) + value.slice(index));
      focus(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focus(index + 1);
    }
  };

  return (
    <div className="otp" role="group" aria-label={`${length}-digit code`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp__box ${invalid ? 'otp__box--invalid' : ''}`}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
