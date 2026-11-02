const pad = (n) => String(n).padStart(2, '0');

export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfMonth = (year, month) => new Date(year, month, 1, 0, 0, 0, 0);
export const endOfMonth = (year, month) => new Date(year, month + 1, 0, 23, 59, 59, 999);

export function dayLabel(date, now = new Date()) {
  const key = dateKey(date);
  if (key === dateKey(now)) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (key === dateKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
}

export const timeLabel = (date) =>
  date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
