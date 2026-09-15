import type { ReactNode } from 'react'
import type {
  SearchSuggestion,
  RecentSearch
} from '@/types/search'
import { SectionHeader } from './SectionHeader'
import { SuggestionItem } from './SuggestionItem'
import { LoadingIndicator } from './LoadingIndicator'
import styles from '../SearchInput.module.css'

/**
 * The props Downshift's `getItemProps` returns for a single item.
 * We type it loosely so the list doesn't need to import Downshift.
 */
export type GetItemProps = (args: {
  item: SearchSuggestion | RecentSearch
  index: number
}) => Record<string, unknown>

export interface SuggestionsListProps {
  /** Recent searches (rendered first if present). */
  recentSearches?: RecentSearch[]
  /** Autosuggest suggestions. */
  suggestions?: SearchSuggestion[]
  /** Current input query — for highlighting matches. */
  query?: string
  /** Loading state — shows spinner instead of items. */
  isLoading?: boolean
  /** Error from the fetcher. Overrides the empty/loading message. */
  error?: Error | null
  /** Which suggestion index is keyboard-highlighted (offset from first suggestion). */
  highlightedSuggestionIndex?: number
  /** Which recent-search index is keyboard-highlighted (offset from first recent). */
  highlightedRecentIndex?: number
  /** Fired when a recent search's remove button is clicked. */
  onRemoveRecent?: (id: string) => void
  /** Fired when "Clear all" is clicked in the recents header. */
  onClearRecents?: () => void
  /** Fired when "Clear all" is clicked in the recents header. */
  onClearSuggestions?: () => void
  /** Custom renderer for suggestion rows. */
  renderSuggestion?: (suggestion: SearchSuggestion) => ReactNode
  /** Message shown when there are no suggestions. */
  emptyMessage?: string
  /** Message shown while loading. */
  loadingMessage?: string
  /** Header for the recents section. */
  recentSearchesLabel?: string
  /** Header for the suggestions section. */
  suggestionsLabel?: string
  /** Whether to render the recents section. */
  showRecentSearches?: boolean
  /** Downshift's getItemProps, injected by the parent. */
  getItemProps: GetItemProps
  className?: string
}

/**
 * Renders the dropdown body. Handles loading/empty/error states and
 * composes section headers with actionable rows.
 *
 * The parent is responsible for wrapping this in Downshift's `getMenuProps`
 * on a surrounding `<ul>` and providing `getItemProps`.
 */
export function SuggestionsList({
  recentSearches = [],
  suggestions = [],
  query = '',
  isLoading = false,
  error = null,
  highlightedSuggestionIndex = -1,
  highlightedRecentIndex = -1,
  onRemoveRecent,
  onClearRecents,
  onClearSuggestions,
  renderSuggestion,
  emptyMessage = 'No results found.',
  loadingMessage = 'Loading…',
  recentSearchesLabel = 'Recent Searches',
  suggestionsLabel = 'Suggestions',
  showRecentSearches = true,
  getItemProps,
  className
}: SuggestionsListProps) {
  const hasRecents = showRecentSearches && recentSearches.length > 0
  const hasSuggestions = suggestions.length > 0

  if (isLoading) {
    return (
      <div className={[styles.listState, className].filter(Boolean).join(' ')}>
        <LoadingIndicator message={loadingMessage} />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className={[styles.listState, styles.listError, className]
          .filter(Boolean)
          .join(' ')}
      >
        {error.message || 'Something went wrong.'}
      </div>
    )
  }

  if (!hasRecents && !hasSuggestions) {
    // Only show the empty message if there's a query to have failed on.
    if (!query.trim()) return null
    return (
      <div className={[styles.listState, className].filter(Boolean).join(' ')}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={[styles.listBody, className].filter(Boolean).join(' ')}>
      {hasRecents && (
        <>
          <ul className={styles.listGroup} role="group" aria-label={recentSearchesLabel}>
            <SectionHeader
              actionLabel={onClearRecents ? 'Clear all' : undefined}
              onAction={onClearRecents}
            >
              {recentSearchesLabel}
            </SectionHeader>
            {recentSearches.map((item, index) => (
              <SuggestionItem
                key={item.id}
                kind="recent"
                label={item.label}
                query={query}
                isHighlighted={index === highlightedRecentIndex}
                onRemove={onRemoveRecent ? () => onRemoveRecent(item.id) : undefined}
                removeLabel={`Remove "${item.label}" from recent searches`}
                {...getItemProps({ item, index })}
              />
            ))}
          </ul>
        </>
      )}

      {hasSuggestions && (
        <ul className={styles.listGroup} role="group" aria-label={suggestionsLabel}>
          <SectionHeader
            actionLabel={onClearSuggestions ? 'Clear' : undefined}
            onAction={onClearSuggestions}
          >
            {suggestionsLabel}
          </SectionHeader>
          {suggestions.map((item, index) => (
            <SuggestionItem
              key={item.id}
              kind="suggestion"
              label={item.label}
              query={query}
              isHighlighted={index === highlightedSuggestionIndex}
              renderContent={
                renderSuggestion ? () => renderSuggestion(item) : undefined
              }
              {...getItemProps({
                item,
                index: recentSearches.length + index
              })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}