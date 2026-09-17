import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'
import type { SearchSuggestion } from '@/types/search'
import { useDebounce } from '@/hooks/useDebounce'

export interface UseSearchSuggestionsOptions {
  /** The current query string (typically from the input's state). */
  query: string
  /** Static list of suggestions. Fuse.js will fuzzy-match against these. */
  suggestions?: SearchSuggestion[]
  /**
   * Async or sync fetcher. Receives the debounced query and an optional AbortSignal.
   * If your fetcher supports cancellation, respect the signal to save bandwidth.
   * If both `suggestions` and `fetchSuggestions` are provided, `suggestions` wins.
   */
  fetchSuggestions?: (
    query: string,
    signal?: AbortSignal
  ) => Promise<SearchSuggestion[]> | SearchSuggestion[]
  /** Debounce delay in ms before querying. Default: 300. */
  debounceMs?: number
  /** Minimum query length before suggestions are computed. Default: 2. */
  minQueryLength?: number
  /** Max number of suggestions to return. Default: 10. */
  limit?: number
  /**
   * Fuse.js options for fuzzy matching (only used with `suggestions`).
   * Treated as init config — changes after mount are ignored until `suggestions` changes.
   */
  fuseOptions?: IFuseOptions<SearchSuggestion>
}

/**
 * Discriminated union for the dropdown's data state.
 * Consumers switch on `status` for exhaustive rendering.
 */
export type SuggestionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; suggestions: SearchSuggestion[] }
  | { status: 'error'; error: Error }

const DEFAULT_FUSE_OPTIONS: IFuseOptions<SearchSuggestion> = {
  keys: [
    { name: 'label', weight: 0.7 },
    { name: 'keywords', weight: 0.3 }
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2
}

// Shared state objects — reused so React can bail out of no-op renders.
const IDLE: SuggestionsState = { status: 'idle' }
const LOADING: SuggestionsState = { status: 'loading' }

export function useSearchSuggestions({
  query,
  suggestions,
  fetchSuggestions,
  debounceMs = 300,
  minQueryLength = 2,
  limit = 10,
  fuseOptions
}: UseSearchSuggestionsOptions): SuggestionsState {
  const debouncedQuery = useDebounce(query, debounceMs)
  const [state, setState] = useState<SuggestionsState>(IDLE)

  // Monotonic counter. Each effect run captures a unique value; async responses
  // compare against the current value to detect staleness.
  const requestIdRef = useRef(0)

  // Latest-ref pattern: decouples effect deps from the identity of
  // `fetchSuggestions`, so an inline arrow won't re-run the effect.
  const fetchRef = useRef(fetchSuggestions)
  useEffect(() => {
    fetchRef.current = fetchSuggestions
  }, [fetchSuggestions])

  // Build the Fuse index only when the static suggestion list changes.
  // `fuseOptions` is intentionally excluded — it's init config, not runtime state.
  const fuse = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return null
    return new Fuse(suggestions, { ...DEFAULT_FUSE_OPTIONS, ...fuseOptions })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    const trimmed = debouncedQuery.trim()

    // Below minimum length → reset to idle (bail out if already idle)
    if (trimmed.length < minQueryLength) {
      setState((prev) => (prev.status === 'idle' ? prev : IDLE))
      return
    }

    // Sync path — static suggestions with Fuse fuzzy matching
    if (fuse) {
      const results = fuse.search(trimmed, { limit })
      setState({
        status: 'success',
        suggestions: results.map((r) => r.item)
      })
      return
    }

    // Async path — consumer-provided fetcher
    const fetcher = fetchRef.current
    if (!fetcher) {
      setState((prev) => (prev.status === 'idle' ? prev : IDLE))
      return
    }

    const controller = new AbortController()
    setState((prev) => (prev.status === 'loading' ? prev : LOADING))

    // Wrap in Promise.resolve().then() so a synchronous throw in the fetcher
    // is captured by .catch rather than escaping the effect.
    Promise.resolve()
      .then(() => fetcher(trimmed, controller.signal))
      .then((results) => {
        if (requestId !== requestIdRef.current) return
        if (controller.signal.aborted) return
        setState({
          status: 'success',
          suggestions: results.slice(0, limit)
        })
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return
        if (controller.signal.aborted) return
        // Abort errors are expected — don't surface them
        if (err instanceof Error && err.name === 'AbortError') return
        setState({
          status: 'error',
          error: err instanceof Error ? err : new Error(String(err))
        })
      })

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, fuse, minQueryLength, limit])

  return state
}