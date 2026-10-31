import { useId, useState } from 'react';
import Icon from './Icon';

export default function TextField({ label, error, hint, prefix, suffix, className = '', ...input }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">{label}</label>
      <div className="field__control">
        {prefix && <span className="field__prefix" aria-hidden="true">{prefix}</span>}
        <input id={id} className="field__input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />
        {suffix}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__error">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      }
    />
  );
}
