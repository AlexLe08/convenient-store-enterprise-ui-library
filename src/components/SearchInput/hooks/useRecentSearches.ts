import { useCallback, useEffect, useState } from 'react'
import type { RecentSearch } from '@/types/search'

const DEFAULT_STORAGE_KEY = 'cs-ui:recent-searches'

export interface UseRecentSearchesOptions {
  /** localStorage key. Change to namespace different search instances. */
  storageKey?: string
  /** Maximum entries to retain. */
  maxItems?: number
}

export interface UseRecentSearchesResult {
  recentSearches: RecentSearch[]
  addRecentSearch: (query: string) => void
  removeRecentSearch: (id: string) => void
  clearRecentSearches: () => void
}

export function useRecentSearches({
  storageKey = DEFAULT_STORAGE_KEY,
  maxItems = 5
}: UseRecentSearchesOptions = {}): UseRecentSearchesResult {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  // Hydrate from localStorage after mount (SSR-safe — localStorage is undefined during SSR)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (!stored) return
      const parsed = JSON.parse(stored) as RecentSearch[]
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, maxItems))
      }
    } catch {
      // Corrupted data — silently reset
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey, maxItems])

  // Persist on every change
  const persist = useCallback(
    (next: RecentSearch[]) => {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Quota exceeded or storage disabled — ignore
      }
    },
    [storageKey]
  )

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return

      setRecentSearches((prev) => {
        // Dedupe (case-insensitive) — move existing entry to top with fresh timestamp
        const filtered = prev.filter(
          (item) => item.label.toLowerCase() !== trimmed.toLowerCase()
        )
        const next: RecentSearch[] = [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            label: trimmed,
            timestamp: Date.now()
          },
          ...filtered
        ].slice(0, maxItems)

        persist(next)
        return next
      })
    },
    [maxItems, persist]
  )

  const removeRecentSearch = useCallback(
    (id: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((item) => item.id !== id)
        persist(next)
        return next
      })
    },
    [persist]
  )

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  }
}