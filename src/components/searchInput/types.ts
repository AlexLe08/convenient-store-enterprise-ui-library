import type { CSSProperties, ReactNode } from 'react'
import type { SearchSuggestion, SearchSource } from '@/types/search'

/**
 * Props for the SearchInput component.
 *
 * The component supports two data sources:
 *   1. `suggestions` — static list, fuzzy-matched with Fuse.js
 *   2. `fetchSuggestions` — async fetcher, called on debounced query changes
 *
 * If both are provided, `suggestions` wins and the fetcher is ignored.
 */
export interface SearchInputProps {
  // ─── Data source ─────────────────────────────────────────────────────────
  /** Static suggestion list. Fuzzy-matched with Fuse.js. */
  suggestions?: SearchSuggestion[]
  /**
   * Async or sync fetcher. Receives the debounced query and an optional
   * AbortSignal (respect it to save bandwidth on rapid typing).
   */
  fetchSuggestions?: (
    query: string,
    signal?: AbortSignal
  ) => Promise<SearchSuggestion[]> | SearchSuggestion[]

  // ─── Behavior ────────────────────────────────────────────────────────────
  /** Debounce delay in ms before querying. Default: 300. */
  debounceMs?: number
  /** Minimum query length before suggestions are computed. Default: 2. */
  minQueryLength?: number
  /** Max recent searches to store and show. Default: 5. */
  maxRecentSearches?: number
  /** localStorage key for recent searches. Default: 'cs-ui:recent-searches'. */
  recentSearchesKey?: string
  /** Max suggestions to display. Default: 10. */
  limit?: number
  /** Whether the recent searches section is shown. Default: true. */
  showRecentSearches?: boolean

  // ─── Callbacks ───────────────────────────────────────────────────────────
  /** Fires on Enter (or suggestion selection) with the final query and its source. */
  onSearch?: (query: string, source: SearchSource) => void
  /** Fires when a suggestion is picked from the dropdown. */
  onSelect?: (suggestion: SearchSuggestion) => void
  /** Fires on every input value change, regardless of debounce. */
  onChange?: (query: string) => void

  // ─── Display ─────────────────────────────────────────────────────────────
  placeholder?: string
  /** Shown when the query yields no suggestions. Default: 'No results found.' */
  emptyMessage?: string
  /** Shown while fetching. Default: 'Loading…' */
  loadingMessage?: string
  /** Header for the recents section. Default: 'Recent Searches'. */
  recentSearchesLabel?: string
  /** Header for the suggestions section. Default: 'Suggestions'. */
  suggestionsLabel?: string
  /** Custom renderer for a suggestion row. Falls back to a highlighted label. */
  renderSuggestion?: (suggestion: SearchSuggestion) => ReactNode
  /** Custom renderer for the leading icon. Pass `null` to hide. */
  renderLeadingIcon?: (() => ReactNode) | null

  // ─── Layout ──────────────────────────────────────────────────────────────
  /** Class applied to the outer container. Use for external layout only. */
  className?: string
  /** Inline styles applied to the outer container. */
  style?: CSSProperties
  /** Disables input and hides the dropdown. */
  disabled?: boolean
  /** Focuses the input on mount. */
  autoFocus?: boolean

  // ─── A11y ────────────────────────────────────────────────────────────────
  /** Accessible label. Required if there is no visible `<label>`. */
  'aria-label'?: string
  /** Element ID. Auto-generated if not provided. */
  id?: string
  /** Associates the input with a form `<label>`. */
  'aria-labelledby'?: string
  /** Describes the input's purpose. */
  'aria-describedby'?: string
}

/**
 * A single row in the dropdown, discriminated by kind.
 * Used internally by `SuggestionsList` and the parent `SearchInput`.
 *
 * NOTE: Section headers are NOT included here. They're rendered
 * separately and never passed to Downshift, so keyboard navigation
 * skips them.
 */
export type DropdownItemKind = 'recent' | 'suggestion'