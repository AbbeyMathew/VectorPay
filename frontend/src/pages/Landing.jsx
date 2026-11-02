import { Link } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import { LogoMark } from '../components/Logo';

function TransferPreview() {
  return (
    <figure className="preview" aria-label="Example: Aarav sends ₹1,250.00 to Diya for dinner">
      <svg className="preview__svg" viewBox="0 0 420 190" role="img" aria-hidden="true">
        <path className="preview__path" d="M92 96 C150 -8 270 -8 328 96" pathLength="1" />
        <polygon className="preview__tip" points="0,0 -13,-7 -13,7" transform="translate(328 96) rotate(61.3)" />

        <circle cx="60" cy="112" r="32" className="preview__node" />
        <text x="60" y="119" textAnchor="middle" className="preview__initials">AM</text>
        <circle cx="360" cy="112" r="32" className="preview__node preview__node--to" />
        <text x="360" y="119" textAnchor="middle" className="preview__initials preview__initials--to">DN</text>

        <text x="60" y="170" textAnchor="middle" className="preview__name">Aarav</text>
        <text x="360" y="170" textAnchor="middle" className="preview__name">Diya</text>
      </svg>

      <figcaption className="preview__caption">
        <span className="preview__amount">₹1,250<small>.00</small></span>
        <span className="preview__note">Dinner split</span>
        <span className="preview__status">Sent</span>
      </figcaption>
    </figure>
  );
}

const FEATURES = [
  {
    title: 'Check the name, then send',
    text: 'Type a phone number and VectorPay shows who owns it before a rupee leaves your wallet.',
    visual: (
      <div className="mini mini--lookup" aria-hidden="true">
        <span>98765 43211</span>
        <b>Diya Nair</b>
      </div>
    ),
  },
  {
    title: 'Add money in one step',
    text: 'Top up from a bank account (simulated here) and the balance updates instantly.',
    visual: (
      <div className="mini mini--add" aria-hidden="true">
        <span>Added from bank</span>
        <b>+₹5,000.00</b>
      </div>
    ),
  },
  {
    title: 'See where it went',
    text: 'A spending calendar shades each day by how much you sent, so busy weeks stand out.',
    visual: (
      <div className="mini mini--heat" aria-hidden="true">
        {[0, 1, 0, 2, 4, 1, 0, 3, 0, 0, 2, 1, 4, 3].map((level, i) => (
          <i key={i} className={`heat-${level}`} />
        ))}
      </div>
    ),
  },
];

const STACK = [
  ['React 18 and Vite', 'Routing, context for auth and notifications, no UI framework.'],
  ['Express and MongoDB', 'Integer-paise money, atomic debits, a ledger row for every transfer.'],
  ['Cookie sessions', 'httpOnly JWT cookie, hashed one-time codes, rate-limited sign-in.'],
  ['Tested and containerised', 'API integration tests, CI on every push, one-command Docker Compose.'],
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <h1 className="hero__title">Send money to a phone number. It lands in seconds.</h1>
            <p className="hero__lead">
              VectorPay is a digital wallet for everyday payments: split dinner, pay rent, or top up your balance,
              and see exactly where your money went.
            </p>
            <div className="hero__actions">
              {user ? (
                <Link to={homePathFor(user)} className="btn btn--primary btn--lg">Go to your wallet</Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--lg">Create a free account</Link>
                  <Link to="/login" className="btn btn--outline btn--lg">Sign in</Link>
                </>
              )}
            </div>
            <p className="hero__fine">This is a portfolio project. No real money moves.</p>
          </div>

          <TransferPreview />
        </div>
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <h2 id="features-title" className="section__title">What you can do</h2>
          <ul className="features">
            {FEATURES.map((f) => (
              <li key={f.title} className="feature">
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
                {f.visual}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="stack-title">
        <div className="container">
          <h2 id="stack-title" className="section__title">How it is built</h2>
          <dl className="stack">
            {STACK.map(([term, detail]) => (
              <div key={term} className="stack__row">
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <span className="footer__brand"><LogoMark size={22} /> VectorPay</span>
          <p>A demo wallet built by Abbey Mathew. Balances are simulated.</p>
        </div>
      </footer>
    </>
  );
}
