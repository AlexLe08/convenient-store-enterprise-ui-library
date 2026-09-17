import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchInput } from './SearchInput'
import type { SearchSuggestion, RecentSearch } from '@/types/search'

const SUGGESTIONS: SearchSuggestion[] = [
  { id: 's1', label: 'iPhone 15 Pro' },
  { id: 's2', label: 'iPhone 15' },
  { id: 's3', label: 'iPad Air' }
]

const RECENTS: RecentSearch[] = [
    { id: 'r1', label: 'iPhone', timestamp: 1000 },
    { id: 'r2', label: 'Samsung', timestamp: 500 }
]

const STORAGE_KEY = 'cs-ui:recent-searches'

function seedRecents(recents: RecentSearch[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recents))
}

describe('SearchInput — integration', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens the dropdown when the user types a valid query', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })
  })

  it('does not open the dropdown below minQueryLength', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={3}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'ip')

    // Give the debounce + effect a chance to fire before asserting
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('moves the highlight through recents, then suggestions', async () => {
    seedRecents(RECENTS)
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.click(input)

    // Wait for recents to hydrate from localStorage
    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument()
    })

    await user.type(input, 'iphone')
    await waitFor(() => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    const getHighlightedText = () =>
      document.querySelector('[data-highlighted="true"]')?.textContent ?? ''

    // ArrowDown → first recent
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(getHighlightedText()).toBe('iPhone'))

    // ArrowDown → second recent
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(getHighlightedText()).toBe('Samsung'))

    // ArrowDown → first suggestion (crosses the section boundary)
    // Fuse decides the suggestion order, we can't hard-code which suggestion is first.
    // This boundary test uses a .startsWith('iPhone 15') check, which is true for both possible first suggestions.
    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      const text = getHighlightedText()
      expect(text.startsWith('iPhone 15')).toBe(true)
    })

    // ArrowUp → back to second recent
    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(getHighlightedText()).toBe('Samsung'))
  })

  it('selects the highlighted item and closes when Enter is pressed', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSearch = vi.fn()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onSelect={onSelect}
        onSearch={onSearch}
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}')

    // Read the actual highlighted label — Fuse ranking decides order
    let expectedLabel = ''
    await waitFor(() => {
      const highlighted = document.querySelector(
        '[data-highlighted="true"]'
      ) as HTMLElement | null
      expectedLabel = highlighted?.textContent ?? ''
      expect(expectedLabel).not.toBe('')
    })

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    expect(input).toHaveValue(expectedLabel)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith(expectedLabel, 'suggestion')
  })

  it('submits the typed query when Enter is pressed with nothing highlighted', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onSelect = vi.fn()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onSearch={onSearch}
        onSelect={onSelect}
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // No ArrowDown — no highlight
    expect(document.querySelector('[data-highlighted="true"]')).toBeNull()

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('iphone', 'typed')
    })
    expect(onSelect).not.toHaveBeenCalled()
    // Dropdown closes even without a selection
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the dropdown on mousedown outside the component', async () => {
    const user = userEvent.setup()

    // Clicking document.body directly is unreliable in jsdom because Downshift's useClickOutside compares the event target against known refs.
    // also a more realistic test: users click other UI, not the void.
    render(
      <>
        <SearchInput
          suggestions={SUGGESTIONS}
          debounceMs={0}
          minQueryLength={1}
          aria-label="Search products"
        />
        <button type="button">Outside</button>
      </>
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    // Downshift listens for mousedown on document — fireEvent avoids
    // jsdom's incomplete pointer-event emulation.
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  it('closes the dropdown on Escape without clearing the input', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    expect(input).toHaveValue('iphone')
  })

  it('clears the input and refocuses when the clear button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onChange={onChange}
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    const clearButton = screen.getByRole('button', { name: 'Clear search' })
    await user.click(clearButton)

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    // Dropdown closes when the query empties
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    // onChange fired for the clearing too
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('fires onChange on every keystroke', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onChange={onChange}
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'abc')

    // Debounce affects the data pipeline, not the onChange callback
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenNthCalledWith(1, 'a')
    expect(onChange).toHaveBeenNthCalledWith(2, 'ab')
    expect(onChange).toHaveBeenNthCalledWith(3, 'abc')
  })

  it('blocks all interaction when disabled', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        disabled
      />
    )

    // userEvent.type on disabled input throws in testing lib v14. we Assert attribute and click instead
    const input = screen.getByRole('combobox', { name: 'Search products' })
    expect(input).toBeDisabled()

    // Clicking should not open the dropdown
    await user.click(input)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // No clear button when disabled, even with a value
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('adds a recent search when a query is committed', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'pixel')

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    await user.keyboard('{Enter}')

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored as string) as RecentSearch[]
      expect(parsed).toHaveLength(1)
      expect(parsed[0].label).toBe('pixel')
    })
  })
})

describe('SearchInput — Tab key behavior', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it('commits the highlighted suggestion when Tab is pressed', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSearch = vi.fn()

    render(
        <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onSelect={onSelect}
        onSearch={onSearch}
        />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
        expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}')

    // Let Fuse decide which item is first — read the actual highlight.
    let expectedLabel = ''
    await waitFor(() => {
        const highlighted = document.querySelector(
        '[data-highlighted="true"]'
        ) as HTMLElement | null
        expect(highlighted).not.toBeNull()
        expectedLabel = highlighted?.textContent ?? ''
        expect(expectedLabel).not.toBe('')
    })

    // Press Tab
    await user.tab()

    // Input now holds whatever was highlighted
    expect(input).toHaveValue(expectedLabel)

    // Dropdown closed
    await waitFor(() => {
        expect(
        document.querySelector('[data-highlighted="true"]')
        ).not.toBeInTheDocument()
    })

    // Callbacks fired with the item that matched the highlight
    expect(onSelect).toHaveBeenCalledTimes(1)
    const selected = onSelect.mock.calls[0][0]
    expect(selected.label).toBe(expectedLabel)
    expect(onSearch).toHaveBeenCalledWith(expectedLabel, 'suggestion')
    })

  it('does not commit when Tab is pressed without a highlight', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSearch = vi.fn()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
        onSelect={onSelect}
        onSearch={onSearch}
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    // No arrow keys pressed — nothing is highlighted
    expect(document.querySelector('[data-highlighted="true"]')).toBeNull()

    // Tab
    await user.tab()

    // Typed query is preserved verbatim
    expect(input).toHaveValue('iphone')

    // No selection or search callbacks should fire
    expect(onSelect).not.toHaveBeenCalled()
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('moves focus to the clear button after committing on Tab', async () => {
    const user = userEvent.setup()

    render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    const input = screen.getByRole('combobox', { name: 'Search products' })
    await user.type(input, 'iphone')

    await waitFor(() => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}')
    await user.tab()

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toHaveFocus()
  })
})