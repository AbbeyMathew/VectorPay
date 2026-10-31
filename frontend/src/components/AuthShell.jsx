import Icon from './Icon';

const POINTS = [
  'You see who you are paying before any money moves.',
  'A balance can never drop below zero, even if two payments land at once.',
  'Your session lives in a secure cookie that page scripts cannot read.',
];

/** Two-column frame shared by sign in, sign up and password reset. */
export default function AuthShell({ title, intro, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__main">
        <div className="auth__panel">
          <h1 className="auth__title">{title}</h1>
          {intro && <p className="auth__intro">{intro}</p>}
          {children}
          {footer && <p className="auth__footer">{footer}</p>}
        </div>
      </div>

      <aside className="auth__aside" aria-label="About VectorPay">
        <svg className="auth__lines" viewBox="0 0 400 600" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <path d="M-20 520 C 120 470, 180 300, 420 90" />
          <path d="M-20 580 C 160 540, 240 380, 420 230" />
          <path d="M60 640 C 200 560, 300 480, 420 380" />
          <circle cx="420" cy="90" r="6" />
          <circle cx="420" cy="230" r="6" />
        </svg>
        <div className="auth__asideBody">
          <p className="auth__asideTitle">Money moves in a straight line from you to them.</p>
          <ul className="auth__points">
            {POINTS.map((p) => (
              <li key={p}>
                <Icon name="check" size={18} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
