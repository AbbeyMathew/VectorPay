import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container notfound">
      <h1>That page doesn't exist</h1>
      <p>The link may be old, or the address may have a typo.</p>
      <Link to="/" className="btn btn--primary">Back to the home page</Link>
    </div>
  );
}
