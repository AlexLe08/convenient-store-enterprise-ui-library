/**
 * A single suggestion rendered in the dropdown.
 * Consumers can pass these as static data or return them from an async fetcher.
 */
export interface SearchSuggestion {
  /** Unique identifier. Used as React key and for a11y. */
  id: string
  /** Display text. Also used as the default search value when selected. */
  label: string
  /** Optional grouping label (e.g., "Products", "Categories") */
  category?: string
  /** Additional keywords to improve fuzzy matching without affecting display */
  keywords?: string[]
  /** Optional image URL for rich suggestion rendering */
  imageUrl?: string
  /** Arbitrary consumer-defined payload passed back via onSelect */
  metadata?: Record<string, unknown>
}

/**
 * A previously-executed search stored in localStorage.
 */
export interface RecentSearch {
  id: string
  label: string
  /** Unix epoch ms — used for sorting and potential expiry */
  timestamp: number
}

/**
 * How the user initiated the current search.
 * Useful for analytics (knowing whether users click recents vs. suggestions).
 */
export type SearchSource = 'typed' | 'suggestion' | 'recent'

/**
 * State machine for the dropdown's visible state.
 */
export type DropdownState =
  | 'closed'        // Input not focused, dropdown hidden
  | 'loading'       // Fetching suggestions
  | 'empty'         // Query has no matches
  | 'recent'        // Showing recent searches (empty input, focused)
  | 'suggestions'   // Showing autosuggest results