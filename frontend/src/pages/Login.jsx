import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import TextField, { PasswordField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../api/client';

export default function Login() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const problems = {};
    if (!form.phone.trim()) problems.phone = 'Enter your phone number';
    if (!form.password) problems.password = 'Enter your password';
    setErrors(problems);
    setFormError('');
    if (Object.keys(problems).length) return;

    setBusy(true);
    try {
      await signIn(form); // GuestRoute then redirects to the right page
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      intro="Welcome back. Use the phone number you registered with."
      footer={<>New to VectorPay? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate className="form">
        {formError && <p className="form__error" role="alert">{formError}</p>}

        <TextField
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          placeholder="98765 43210"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Link to="/forgot-password" className="form__aside">Forgot your password?</Link>

        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
