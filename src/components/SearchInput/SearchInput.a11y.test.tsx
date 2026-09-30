import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it } from 'vitest'
import { SearchInput } from './SearchInput'
import type { SearchSuggestion, RecentSearch } from '@/types/search'

const SUGGESTIONS: SearchSuggestion[] = [
  { id: 's1', label: 'iPhone 15 Pro', category: 'Phones' },
  { id: 's2', label: 'iPhone 15', category: 'Phones' },
  { id: 's3', label: 'Samsung Galaxy S24', category: 'Phones' },
]

const RECENTS: RecentSearch[] = [
  { id: 'r1', label: 'iPhone', timestamp: 1000 },
  { id: 'r2', label: 'Samsung', timestamp: 500 },
]

const STORAGE_KEY = 'cs-ui:recent-searches'

/**
 * Axe scans a DOM node and everything attached to the document it belongs to.
 * Because the SearchInput's dropdown is portaled to document.body, scanning
 * the RTL container alone would miss every suggestion item. We scan the
 * document body, which includes both the input and the portal contents.
 * The `color-contrast` rule is disabled because jsdom doesn't implement
 * `getComputedStyle(elt, pseudoElt)` or `HTMLCanvasElement.getContext`,
 * both of which axe needs to evaluate contrast. The rule works correctly
 * in a real browser and is covered by the Storybook a11y addon. See:
 * https://github.com/dequelabs/axe-core/issues/595
 */
async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe(container.ownerDocument.body, {
    rules: {
      // Page-level rule. Not applicable to isolated component tests —
      // there's no <main> landmark because we're rendering a single
      // component. Covered by the Storybook a11y addon in a real page.
      region: { enabled: false },
      // jsdom doesn't implement getComputedStyle(elt, pseudoElt) or
      // HTMLCanvasElement.getContext, both required by color-contrast.
      // Works correctly in a real browser via Storybook's a11y addon.
      // https://github.com/dequelabs/axe-core/issues/595
      'color-contrast': { enabled: false },
    },
  })
  expect(results).toHaveNoViolations()
}

describe('SearchInput — accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.body.innerHTML = ''
  })

  it('has no violations in the idle state', async () => {
    const { container } = render(
      <SearchInput suggestions={SUGGESTIONS} aria-label="Search products" />
    )
    await expectNoA11yViolations(container)
  })

  it('has no violations when disabled', async () => {
    const { container } = render(
      <SearchInput suggestions={SUGGESTIONS} aria-label="Search products" disabled />
    )
    await expectNoA11yViolations(container)
  })

  it('has no violations with recent searches open', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(RECENTS))
    const user = userEvent.setup()

    const { container } = render(
      <SearchInput suggestions={SUGGESTIONS} aria-label="Search products" />
    )

    await user.click(screen.getByRole('combobox', { name: 'Search products' }))
    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument()
    })

    await expectNoA11yViolations(container)
  })

  it('has no violations with suggestions open', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    await user.type(screen.getByRole('combobox', { name: 'Search products' }), 'iphone')
    await waitFor(() => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    await expectNoA11yViolations(container)
  })

  it('has no violations with a suggestion highlighted', async () => {
    const user = userEvent.setup()

    const { container } = render(
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
    await waitFor(() => {
      expect(document.querySelector('[data-highlighted="true"]')).not.toBeNull()
    })

    await expectNoA11yViolations(container)
  })

  it('has no violations in the loading state', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <SearchInput
        fetchSuggestions={() => new Promise(() => {})}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    await user.type(screen.getByRole('combobox', { name: 'Search products' }), 'iphone')
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    await expectNoA11yViolations(container)
  })

  it('has no violations in the error state', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <SearchInput
        fetchSuggestions={async () => {
          throw new Error('Network failure')
        }}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    await user.type(screen.getByRole('combobox', { name: 'Search products' }), 'iphone')
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await expectNoA11yViolations(container)
  })

  it('has no violations in the empty state', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <SearchInput
        suggestions={SUGGESTIONS}
        debounceMs={0}
        minQueryLength={1}
        aria-label="Search products"
      />
    )

    await user.type(screen.getByRole('combobox', { name: 'Search products' }), 'zzzzzz')
    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })

    await expectNoA11yViolations(container)
  })
})
