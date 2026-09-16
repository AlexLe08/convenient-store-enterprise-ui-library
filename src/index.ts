// Components
export { SearchInput } from './components/SearchInput/SearchInput'
export type { SearchInputProps, FlatItem, GetItemPropsFn } from './components/SearchInput/types'

// Hooks
export { useDebounce } from './hooks/useDebounce'
export {
  useSearchSuggestions,
  type UseSearchSuggestionsOptions,
  type SuggestionsState
} from './components/SearchInput/hooks/useSearchSuggestions'
export {
  useRecentSearches,
  type UseRecentSearchesOptions,
  type UseRecentSearchesResult
} from './components/SearchInput/hooks/useRecentSearches'

// Types
export type {
  SearchSuggestion,
  RecentSearch,
  SearchSource,
  DropdownState
} from './types/search'