"use client";

import { useEffect, useState } from "react";

/** Returns `value` after it stops changing for `delay` ms (used for search boxes). */
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
