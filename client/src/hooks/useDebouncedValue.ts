import { useEffect, useState } from 'react';

/** Returns `value`, but only after it has stopped changing for `delayMs` (used for search-as-you-type). */
export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
