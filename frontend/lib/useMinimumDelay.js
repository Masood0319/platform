import { useEffect, useState } from "react";

export function useMinimumDelay({ delay = 650, initial = true } = {}) {
  const [loading, setLoading] = useState(initial);

  useEffect(() => {
    if (!initial) return undefined;
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay, initial]);

  return [loading, setLoading];
}
