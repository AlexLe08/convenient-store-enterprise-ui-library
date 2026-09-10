import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that updates at most every `delayMs`.
 * Used to throttle expensive operations (e.g., API calls, fuzzy search) triggered by typing.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}