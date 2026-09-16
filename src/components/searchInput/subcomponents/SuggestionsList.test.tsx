import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SuggestionsList } from './SuggestionsList'
import type { SearchSuggestion, RecentSearch } from '@/types/search'

// Stub getItemProps — tests don't exercise Downshift here
const getItemProps: React.ComponentProps<typeof SuggestionsList>['getItemProps'] = ({
  index
}) => ({
  id: `item-${index}`,
  role: 'option',
  'aria-selected': false,
  'data-testid': `item-${index}`
})

const RECENTS: RecentSearch[] = [
  { id: 'r1', label: 'iPhone', timestamp: 1 },
  { id: 'r2', label: 'Samsung', timestamp: 2 }
]

const SUGGESTIONS: SearchSuggestion[] = [
  { id: 's1', label: 'iPhone 15 Pro' },
  { id: 's2', label: 'iPhone 15' }
]

describe('SuggestionsList', () => {
  it('renders nothing when there is no query and no items', () => {
    const { container } = render(
      <SuggestionsList getItemProps={getItemProps} query="" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the empty message when there is a query but no items', () => {
    render(<SuggestionsList getItemProps={getItemProps} query="zzz" />)
    expect(screen.getByText('No results found.')).toBeInTheDocument()
  })

  it('renders the loading state', () => {
    render(<SuggestionsList getItemProps={getItemProps} isLoading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the error state with role="alert"', () => {
    render(
      <SuggestionsList getItemProps={getItemProps} error={new Error('Boom')} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Boom')
  })

  it('renders both sections with their labels', () => {
    render(
      <SuggestionsList
        getItemProps={getItemProps}
        query="iphone"
        recentSearches={RECENTS}
        suggestions={SUGGESTIONS}
      />
    )
    expect(screen.getByText('Recent Searches')).toBeInTheDocument()
    expect(screen.getByText('Suggestions')).toBeInTheDocument()

    const recentsSection = screen.getByRole('group', { name: 'Recent Searches' })
    const suggestionsSection = screen.getByRole('group', { name: 'Suggestions' })
    expect(recentsSection.textContent).toContain('iPhone')
    expect(recentsSection.textContent).toContain('Samsung')
    expect(suggestionsSection.textContent).toContain('iPhone 15 Pro')
    expect(suggestionsSection.textContent).toContain('iPhone 15')
  })

  it('hides the recents section when showRecentSearches is false', () => {
    render(
      <SuggestionsList
        getItemProps={getItemProps}
        query="iphone"
        recentSearches={RECENTS}
        suggestions={SUGGESTIONS}
        showRecentSearches={false}
      />
    )
    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument()
    expect(screen.getByText('Suggestions')).toBeInTheDocument()
  })

  it('passes the correct flat index to getItemProps for suggestions', () => {
    const spy = vi.fn(getItemProps)
    render(
      <SuggestionsList
        getItemProps={spy}
        query="iphone"
        recentSearches={RECENTS}
        suggestions={SUGGESTIONS}
      />
    )

    // First suggestion should be at index 2 (after 2 recents)
    const calls = spy.mock.calls.map((c) => c[0].index)
    expect(calls).toEqual([0, 1, 2, 3])
  })

  it('highlights the correct items by index', () => {
    const { container } = render(
      <SuggestionsList
        getItemProps={getItemProps}
        query="iphone"
        recentSearches={RECENTS}
        suggestions={SUGGESTIONS}
        highlightedRecentIndex={1}
        highlightedSuggestionIndex={0}
      />
    )

    const highlighted = container.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted).toHaveLength(2)
  })

  it('fires onRemoveRecent with the item id', async () => {
    const onRemove = vi.fn()
    render(
      <SuggestionsList
        getItemProps={getItemProps}
        query=""
        recentSearches={RECENTS}
        onRemoveRecent={onRemove}
      />
    )

    await userEvent.click(
      screen.getByRole('button', { name: /Remove "iPhone"/ })
    )
    expect(onRemove).toHaveBeenCalledWith('r1')
  })

  it('fires onClearRecents when Clear all is clicked', async () => {
    const onClear = vi.fn()
    render(
      <SuggestionsList
        getItemProps={getItemProps}
        query=""
        recentSearches={RECENTS}
        onClearRecents={onClear}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('uses renderSuggestion for custom suggestion rows', () => {
    render(
      <SuggestionsList
        getItemProps={getItemProps}
        query="iphone"
        suggestions={SUGGESTIONS}
        renderSuggestion={(s) => <span data-testid={`custom-${s.id}`}>{s.label}!</span>}
      />
    )
    expect(screen.getByTestId('custom-s1')).toHaveTextContent('iPhone 15 Pro!')
  })
})