import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useRecentSearches } from './useRecentSearches'
import type { RecentSearch } from '@/types/search'

const STORAGE_KEY = 'cs-ui:recent-searches'

describe('useRecentSearches', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts empty when storage is empty', () => {
    const { result } = renderHook(() => useRecentSearches())
    expect(result.current.recentSearches).toEqual([])
  })

  it('hydrates from localStorage on mount', async () => {
    const stored: RecentSearch[] = [
      { id: '1', label: 'iPhone', timestamp: 1000 },
      { id: '2', label: 'Samsung', timestamp: 900 }
    ]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const { result } = renderHook(() => useRecentSearches())

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual(stored)
    })
  })

  it('recovers from corrupted localStorage data', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not valid json')

    const { result } = renderHook(() => useRecentSearches())

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([])
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  it('ignores non-array JSON in storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))

    const { result } = renderHook(() => useRecentSearches())

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([])
    })
  })

  it('prepends new searches', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('iPhone'))
    act(() => result.current.addRecentSearch('Samsung'))

    await waitFor(() => {
      expect(result.current.recentSearches.map((r) => r.label)).toEqual([
        'Samsung',
        'iPhone'
      ])
    })
  })

  it('trims whitespace and ignores empty queries', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('   '))
    act(() => result.current.addRecentSearch(''))

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([])
    })

    act(() => result.current.addRecentSearch('  iPhone  '))
    await waitFor(() => {
      expect(result.current.recentSearches[0].label).toBe('iPhone')
    })
  })

  it('dedupes case-insensitively and moves the duplicate to the top', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('iPhone'))
    act(() => result.current.addRecentSearch('Samsung'))
    act(() => result.current.addRecentSearch('IPHONE'))

    await waitFor(() => {
      expect(result.current.recentSearches.map((r) => r.label)).toEqual([
        'IPHONE',
        'Samsung'
      ])
    })
  })

  it('respects the maxItems limit', async () => {
    const { result } = renderHook(() => useRecentSearches({ maxItems: 3 }))

    act(() => result.current.addRecentSearch('one'))
    act(() => result.current.addRecentSearch('two'))
    act(() => result.current.addRecentSearch('three'))
    act(() => result.current.addRecentSearch('four'))

    await waitFor(() => {
      expect(result.current.recentSearches.map((r) => r.label)).toEqual([
        'four',
        'three',
        'two'
      ])
    })
  })

  it('persists to localStorage on every change', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('iPhone'))

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].label).toBe('iPhone')
    })
  })

  it('uses a custom storage key when provided', async () => {
    const { result } = renderHook(() =>
      useRecentSearches({ storageKey: 'custom-key' })
    )

    act(() => result.current.addRecentSearch('iPhone'))

    await waitFor(() => {
      expect(window.localStorage.getItem('custom-key')).toBeTruthy()
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  it('removes a specific entry by id', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('iPhone'))
    act(() => result.current.addRecentSearch('Samsung'))

    const idToRemove = result.current.recentSearches[0].id

    act(() => result.current.removeRecentSearch(idToRemove))

    await waitFor(() => {
      expect(result.current.recentSearches.map((r) => r.label)).toEqual(['iPhone'])
    })
  })

  it('clears all entries and removes the storage key', async () => {
    const { result } = renderHook(() => useRecentSearches())

    act(() => result.current.addRecentSearch('iPhone'))
    act(() => result.current.addRecentSearch('Samsung'))

    act(() => result.current.clearRecentSearches())

    await waitFor(() => {
      expect(result.current.recentSearches).toEqual([])
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })
})