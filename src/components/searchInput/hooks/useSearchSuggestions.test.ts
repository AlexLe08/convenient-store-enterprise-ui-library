import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSearchSuggestions } from './useSearchSuggestions'
import type { SearchSuggestion } from '@/types/search'

const STATIC_SUGGESTIONS: SearchSuggestion[] = [
  { id: '1', label: 'iPhone 15 Pro' },
  { id: '2', label: 'iPhone 15' },
  { id: '3', label: 'Samsung Galaxy S24' },
  { id: '4', label: 'Google Pixel 8' }
]

describe('useSearchSuggestions', () => {
  describe('idle state', () => {
    it('starts idle', () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: '',
          suggestions: STATIC_SUGGESTIONS,
          debounceMs: 0
        })
      )
      expect(result.current).toEqual({ status: 'idle' })
    })

    it('stays idle when query is below minQueryLength', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'i',
          suggestions: STATIC_SUGGESTIONS,
          debounceMs: 0,
          minQueryLength: 2
        })
      )

      await waitFor(() => expect(result.current.status).toBe('idle'))
    })

    it('resets to idle when query drops below minQueryLength', async () => {
      const { result, rerender } = renderHook(
        ({ query }: { query: string }) =>
          useSearchSuggestions({
            query,
            suggestions: STATIC_SUGGESTIONS,
            debounceMs: 0
          }),
        { initialProps: { query: 'iphone' } }
      )

      await waitFor(() => expect(result.current.status).toBe('success'))

      rerender({ query: 'i' })

      await waitFor(() => expect(result.current.status).toBe('idle'))
    })
  })

  describe('sync path (static suggestions)', () => {
    it('fuzzy matches against static suggestions', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          suggestions: STATIC_SUGGESTIONS,
          debounceMs: 0
        })
      )

      await waitFor(() => {
        expect(result.current.status).toBe('success')
        if (result.current.status === 'success') {
          expect(result.current.suggestions.length).toBeGreaterThan(0)
          expect(result.current.suggestions[0].label).toContain('iPhone')
        }
      })
    })

    it('respects the limit option', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'phone',
          suggestions: STATIC_SUGGESTIONS,
          debounceMs: 0,
          limit: 1
        })
      )

      await waitFor(() => {
        if (result.current.status === 'success') {
          expect(result.current.suggestions.length).toBeLessThanOrEqual(1)
        }
      })
    })

    it('returns empty array when nothing matches', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'zzzzzzzzz',
          suggestions: STATIC_SUGGESTIONS,
          debounceMs: 0
        })
      )

      await waitFor(() => {
        if (result.current.status === 'success') {
          expect(result.current.suggestions).toEqual([])
        }
      })
    })
  })

  describe('async path', () => {
    it('calls the fetcher with the debounced query', async () => {
      const fetcher = vi.fn(async () => STATIC_SUGGESTIONS)

      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          fetchSuggestions: fetcher,
          debounceMs: 0
        })
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledWith('iphone', expect.any(AbortSignal))
        expect(result.current.status).toBe('success')
      })
    })

    it('transitions loading → success', async () => {
      const fetcher = vi.fn(
        () =>
          new Promise<SearchSuggestion[]>((resolve) =>
            setTimeout(() => resolve(STATIC_SUGGESTIONS), 20)
          )
      )

      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          fetchSuggestions: fetcher,
          debounceMs: 0
        })
      )

      await waitFor(() => expect(result.current.status).toBe('loading'))
      await waitFor(() => expect(result.current.status).toBe('success'))
    })

    it('transitions loading → error on fetcher rejection', async () => {
      const fetcher = vi.fn(async () => {
        throw new Error('Network failure')
      })

      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          fetchSuggestions: fetcher,
          debounceMs: 0
        })
      )

      await waitFor(() => {
        expect(result.current.status).toBe('error')
        if (result.current.status === 'error') {
          expect(result.current.error.message).toBe('Network failure')
        }
      })
    })

    it('captures synchronous throws from the fetcher', async () => {
      const fetcher = vi.fn(() => {
        throw new Error('Sync throw')
      })

      const { result } = renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          fetchSuggestions: fetcher,
          debounceMs: 0
        })
      )

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })
    })

    it('passes an AbortSignal to the fetcher', async () => {
      const fetcher = vi.fn(
        async (_query: string, _signal?: AbortSignal) =>
          [] as SearchSuggestion[]
      )

      renderHook(() =>
        useSearchSuggestions({
          query: 'iphone',
          fetchSuggestions: fetcher,
          debounceMs: 0
        })
      )

      await waitFor(() => expect(fetcher).toHaveBeenCalled())
      const signal = fetcher.mock.calls[0][1] as AbortSignal | undefined
      expect(signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('race conditions', () => {
    it('ignores stale responses when a newer request resolves first', async () => {
      const pending: Array<{
        query: string
        resolve: (v: SearchSuggestion[]) => void
      }> = []

      const fetcher = vi.fn(
        (query: string) =>
          new Promise<SearchSuggestion[]>((resolve) => {
            pending.push({ query, resolve })
          })
      )

      const { result, rerender } = renderHook(
        ({ query }: { query: string }) =>
          useSearchSuggestions({
            query,
            fetchSuggestions: fetcher,
            debounceMs: 0
          }),
        { initialProps: { query: 'ab' } }
      )

      // First fetch starts
      await waitFor(() => expect(pending.length).toBe(1))

      // User types more — second fetch starts, first is now stale
      rerender({ query: 'abc' })
      await waitFor(() => expect(pending.length).toBe(2))

      // The NEWER request (index 1) resolves first
      await act(async () => {
        pending[1].resolve([{ id: 'new', label: 'Fresh result' }])
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
        if (result.current.status === 'success') {
          expect(result.current.suggestions).toEqual([
            { id: 'new', label: 'Fresh result' }
          ])
        }
      })

      // The OLDER request (index 0) resolves later — must be ignored
      await act(async () => {
        pending[0].resolve([{ id: 'stale', label: 'Stale result' }])
      })

      // State must still show the fresh result
      expect(result.current.status).toBe('success')
      if (result.current.status === 'success') {
        expect(result.current.suggestions[0].id).toBe('new')
      }
    })

    it('aborts the previous request when a new one starts', async () => {
      const signals: AbortSignal[] = []
      const fetcher = vi.fn((_query: string, signal?: AbortSignal) => {
        if (signal) signals.push(signal)
        return new Promise<SearchSuggestion[]>(() => {})
      })

      const { rerender } = renderHook(
        ({ query }: { query: string }) =>
          useSearchSuggestions({
            query,
            fetchSuggestions: fetcher,
            debounceMs: 0
          }),
        { initialProps: { query: 'ab' } }
      )

      await waitFor(() => expect(signals.length).toBe(1))
      expect(signals[0].aborted).toBe(false)

      rerender({ query: 'abc' })

      await waitFor(() => {
        expect(signals.length).toBe(2)
        expect(signals[0].aborted).toBe(true)
      })
    })
  })

  describe('missing configuration', () => {
    it('stays idle when neither suggestions nor fetcher are provided', async () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({ query: 'iphone', debounceMs: 0 })
      )

      await waitFor(() => expect(result.current.status).toBe('idle'))
    })
  })
})