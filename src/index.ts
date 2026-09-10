// Components
export * from './components'

// Hooks
export { useDebounce } from './hooks/useDebounce'
export { useRecentSearches } from './components/SearchInput/hooks/useRecentSearches'
export type {
  UseRecentSearchesOptions,
  UseRecentSearchesResult
} from './components/SearchInput/hooks/useRecentSearches'

// Types
export type {
  SearchSuggestion,
  RecentSearch,
  SearchSource,
  DropdownState
} from './types/search'