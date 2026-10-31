import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--pine-900)" />
      <path d="M8.5 10.5 16 22.5l7.5-12" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.5" cy="9.5" r="2.8" fill="var(--jade-500)" />
    </svg>
  );
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="VectorPay home">
      <LogoMark />
      <span className="logo__word">VectorPay</span>
    </Link>
  );
}
