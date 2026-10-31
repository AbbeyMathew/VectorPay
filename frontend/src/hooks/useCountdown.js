import { useEffect, useState } from 'react';

/** Counts down from `start(n)` to 0 in whole seconds. Returns [secondsLeft, start]. */
export default function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return [left, setLeft];
}
