import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import TextField, { PasswordField } from '../components/TextField';
import OtpInput from '../components/OtpInput';
import useCountdown from '../hooks/useCountdown';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/endpoints';
import { errorMessage, fieldErrors } from '../api/client';

const STEPS = ['Email', 'Code', 'New password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useCountdown();

  const run = async (action) => {
    setBusy(true);
    setError('');
    setFieldError({});
    try {
      await action();
    } catch (err) {
      setFieldError(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (e) => {
    e?.preventDefault();
    if (!email.trim()) return setError('Enter the email you signed up with');
    return run(async () => {
      await authApi.forgot(email.trim());
      setCooldown(30);
      setCode('');
      setStep(1);
    });
  };

  const checkCode = (value = code) => {
    if (value.length < 6) return setError('Enter all 6 digits');
    return run(async () => {
      const res = await authApi.verifyOtp(email.trim(), value);
      setResetToken(res.data.resetToken);
      setStep(2);
    });
  };

  const savePassword = (e) => {
    e.preventDefault();
    return run(async () => {
      await authApi.reset(resetToken, password);
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login');
    });
  };

  return (
    <AuthShell
      title="Reset your password"
      footer={<Link to="/login">Back to sign in</Link>}
      intro={
        step === 0 ? 'Enter your email and we will send you a 6-digit code.'
        : step === 1 ? `We sent a code to ${email.trim()}. It expires in 10 minutes.`
        : 'Choose a new password. Signing in elsewhere will stop working.'
      }
    >
      <ol className="steps" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'steps__item steps__item--done' : i === step ? 'steps__item steps__item--now' : 'steps__item'} aria-current={i === step ? 'step' : undefined}>
            {label}
          </li>
        ))}
      </ol>

      {error && step !== 1 && <p className="form__error" role="alert">{error}</p>}

      {step === 0 && (
        <form onSubmit={sendCode} noValidate className="form">
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError.email} />
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
        </form>
      )}

      {step === 1 && (
        <div className="form">
          <OtpInput value={code} onChange={setCode} onComplete={checkCode} disabled={busy} invalid={Boolean(error)} />
          {error && <p className="form__error" role="alert">{error}</p>}
          <button type="button" className="btn btn--primary btn--block" disabled={busy || code.length < 6} onClick={() => checkCode()}>
            {busy ? 'Checking…' : 'Verify code'}
          </button>
          <button type="button" className="btn btn--text btn--block" disabled={busy || cooldown > 0} onClick={sendCode}>
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={savePassword} noValidate className="form">
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldError.password}
          />
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        </form>
      )}
    </AuthShell>
  );
}
