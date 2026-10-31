import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import TextField, { PasswordField } from '../components/TextField';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../api/client';

const RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['A letter', (p) => /[A-Za-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
];

export default function Register() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const problems = {};
    if (form.name.trim().length < 2) problems.name = 'Enter your full name';
    if (!form.phone.trim()) problems.phone = 'Enter your phone number';
    if (!form.email.trim()) problems.email = 'Enter your email address';
    if (RULES.some(([, test]) => !test(form.password))) problems.password = 'Choose a password that meets the rules below';
    setErrors(problems);
    setFormError('');
    if (Object.keys(problems).length) return;

    setBusy(true);
    try {
      await signUp(form);
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      intro="It takes a minute. Your wallet starts empty and you can add money straight away."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="form">
        {formError && <p className="form__error" role="alert">{formError}</p>}

        <TextField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98765 43210"
          hint="Friends will use this number to pay you."
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
        />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />

        <ul className="rules" aria-label="Password rules">
          {RULES.map(([label, test]) => (
            <li key={label} className={test(form.password) ? 'rules__item rules__item--met' : 'rules__item'}>
              <Icon name="check" size={14} />
              {label}
            </li>
          ))}
        </ul>

        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
