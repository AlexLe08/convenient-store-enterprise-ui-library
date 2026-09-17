import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { SearchInput } from './SearchInput'
import type { SearchSuggestion } from '@/types/search'

// ─── Sample data ───────────────────────────────────────────────────────────
const PRODUCTS: SearchSuggestion[] = [
  { id: 'p1', label: 'iPhone 15 Pro', category: 'Phones', keywords: ['apple', 'mobile'] },
  { id: 'p2', label: 'iPhone 15', category: 'Phones', keywords: ['apple', 'mobile'] },
  { id: 'p3', label: 'iPhone 14', category: 'Phones', keywords: ['apple'] },
  { id: 'p4', label: 'Samsung Galaxy S24', category: 'Phones', keywords: ['android'] },
  { id: 'p5', label: 'Samsung Galaxy Buds', category: 'Audio', keywords: ['earbuds'] },
  { id: 'p6', label: 'Google Pixel 8', category: 'Phones', keywords: ['android'] },
  { id: 'p7', label: 'Sony WH-1000XM5', category: 'Audio', keywords: ['headphones'] },
  { id: 'p8', label: 'iPad Air', category: 'Tablets', keywords: ['apple'] },
  { id: 'p9', label: 'MacBook Pro 14"', category: 'Laptops', keywords: ['apple'] },
  { id: 'p10', label: 'AirPods Pro', category: 'Audio', keywords: ['apple', 'earbuds'] }
]

// ─── Decorators ────────────────────────────────────────────────────────────
/**
 * Seeds localStorage with the given labels before rendering the story.
 * Cleaned up automatically when the story unmounts so stories don't leak
 * recent searches into each other.
 */
const withSeededRecents =
  (labels: string[], storageKey = 'cs-ui:recent-searches'): Decorator =>
  function SeededRecentsDecorator(Story) {
    if (typeof window !== 'undefined') {
      const entries = labels.map((label, i) => ({
        id: `seed-${label}`,
        label,
        timestamp: Date.now() - i * 1000
      }))
      window.localStorage.setItem(storageKey, JSON.stringify(entries))
    }

    useEffect(() => {
      return () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(storageKey)
        }
      }
    }, [])

    return <Story />
  }


/**
 * Simulates a network-backed suggestion source with a 600ms delay.
 * Respects the AbortSignal so a fast typist won't leave orphaned timers.
 */
async function mockFetchSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<SearchSuggestion[]> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 600)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  const lower = query.toLowerCase()
  return PRODUCTS.filter((p) => p.label.toLowerCase().includes(lower))
}

// ─── Meta ──────────────────────────────────────────────────────────────────
const meta = {
  title: 'Components/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An accessible search input with autosuggest, recent searches, ' +
          'and full keyboard navigation. Supports both static suggestion ' +
          'lists (fuzzy-matched with Fuse.js) and async fetchers.'
      }
    }
  },
  argTypes: {
    placeholder: { control: 'text' },
    debounceMs: { control: { type: 'number', min: 0, step: 50 } },
    minQueryLength: { control: { type: 'number', min: 1, max: 5 } },
    limit: { control: { type: 'number', min: 1, max: 20 } },
    showRecentSearches: { control: 'boolean' },
    disabled: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    suggestions: { control: false },
    fetchSuggestions: { control: false },
    renderSuggestion: { control: false },
    renderLeadingIcon: { control: false }
  },
  args: {
    placeholder: 'Search products…',
    'aria-label': 'Product search'
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '32rem', paddingBottom: '16rem' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ───────────────────────────────────────────────────────────────

/**
 * The default, empty state. Click to focus — the dropdown stays closed
 * until there's a query or recent searches to show.
 */
export const Default: Story = {}

/**
 * Static suggestion list. Fuse.js fuzzy-matches against `label` and
 * `keywords` as the user types. Try typing "phone", "apple", or a typo
 * like "iphon" to see fuzzy matching in action.
 */
export const WithStaticSuggestions: Story = {
  args: {
    suggestions: PRODUCTS,
    minQueryLength: 1
  }
}

/**
 * Async fetcher with simulated network latency. Notice the loading
 * spinner on every query, and how rapidly typing doesn't fire a request
 * per keystroke — the hook debounces.
 */
export const WithAsyncFetcher: Story = {
  args: {
    fetchSuggestions: mockFetchSuggestions,
    minQueryLength: 1,
    debounceMs: 250
  }
}

/**
 * Recent searches seeded into localStorage. The "Clear all" action
 * empties the list. Individual items have a remove button.
 */
export const WithRecentSearches: Story = {
  args: {
    suggestions: PRODUCTS,
    minQueryLength: 1
  },
  decorators: [withSeededRecents(['iPhone 15 Pro', 'Samsung Galaxy', 'AirPods'])]
}

/**
 * Error state — the fetcher rejects. The dropdown shows the error message
 * with `role="alert"` so screen readers announce it.
 */
export const WithError: Story = {
  args: {
    minQueryLength: 1,
    debounceMs: 100,
    fetchSuggestions: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      throw new Error('Unable to load suggestions. Please try again.')
    }
  }
}

/**
 * Custom suggestion rendering. Demonstrates images, prices, and category
 * badges. When `renderSuggestion` is provided, built-in highlighting is
 * skipped — the custom renderer owns the layout.
 */
export const WithCustomRendering: Story = {
  args: {
    minQueryLength: 1,
    suggestions: PRODUCTS.map((p) => ({
      ...p,
      imageUrl: `https://placehold.co/40x40/e5e7eb/374151?text=${encodeURIComponent(
        p.label.charAt(0)
      )}`
    })),
    renderSuggestion: (suggestion) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        {suggestion.imageUrl && (
          <img
            src={suggestion.imageUrl}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontWeight: 500 }}>{suggestion.label}</span>
          {suggestion.category && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {suggestion.category}
            </span>
          )}
        </div>
      </div>
    )
  }
}

/**
 * No leading icon — the input looks cleaner when the search icon is
 * redundant (e.g., the input already sits inside a labeled toolbar).
 */
export const WithoutLeadingIcon: Story = {
  args: {
    suggestions: PRODUCTS,
    minQueryLength: 1,
    renderLeadingIcon: null
  }
}

/**
 * Disabled state. The input is unfocusable and the dropdown never opens.
 */
export const Disabled: Story = {
  args: {
    suggestions: PRODUCTS,
    disabled: true,
    placeholder: 'Search is unavailable'
  }
}