import Icon from './Icon';

const TONES = [
  ['#d9f3e7', '#0a4d33'],
  ['#fde9d3', '#7a3b05'],
  ['#e3e8fb', '#2b3a8c'],
  ['#fbe1ea', '#8a1f47'],
  ['#e9f0d2', '#425b0e'],
  ['#dfeff7', '#0d4a6b'],
];

const hash = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function Avatar({ name = '', size = 40, variant = 'person' }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (variant === 'bank') {
    return (
      <span className="avatar avatar--bank" style={style} aria-hidden="true">
        <Icon name="bank" size={Math.round(size * 0.5)} />
      </span>
    );
  }

  const [bg, fg] = TONES[hash(name) % TONES.length];
  return (
    <span className="avatar" style={{ ...style, background: bg, color: fg }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
