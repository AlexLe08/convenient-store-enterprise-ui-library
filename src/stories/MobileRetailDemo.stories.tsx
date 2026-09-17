import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SearchInput } from '@/components/SearchInput/SearchInput'
import { PRODUCTS, SUGGESTIONS, CATEGORIES } from './shared/products'
import styles from './MobileRetailDemo.module.css'

function MobileRetailDemo() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = (() => {
    if (query) {
      return PRODUCTS.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    }
    if (activeCategory) {
      return PRODUCTS.filter((p) => p.category === activeCategory)
    }
    return PRODUCTS
  })()

  const handleCategory = (cat: string) => {
    setQuery('')
    setActiveCategory((current) => (current === cat ? null : cat))
  }

  const clearFilters = () => {
    setQuery('')
    setActiveCategory(null)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>CS</span>
            <span className={styles.brandName}>Convenient Store</span>
          </div>
          <button type="button" className={styles.cartButton} aria-label="Cart">
            <svg viewBox="0 0 20 20" width="18" height="18" focusable="false">
              <path
                d="M6 6V4a4 4 0 0 1 8 0v2M5 6h10l1 10H4L5 6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <SearchInput
          suggestions={SUGGESTIONS}
          placeholder="Search products…"
          aria-label="Search products"
          minQueryLength={1}
          recentSearchesKey="cs-ui:mobile-demo-recents"
          onSearch={(q) => {
            setQuery(q)
            setActiveCategory(null)
          }}
          renderSuggestion={(suggestion) => (
            <div className={styles.suggestionRow}>
              {suggestion.imageUrl && (
                <img src={suggestion.imageUrl} alt="" className={styles.suggestionImage} />
              )}
              <div className={styles.suggestionText}>
                <span className={styles.suggestionLabel}>{suggestion.label}</span>
                {suggestion.category && (
                  <span className={styles.suggestionCategory}>{suggestion.category}</span>
                )}
              </div>
            </div>
          )}
        />
      </header>

      <div className={styles.content}>
        <div className={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={[styles.chip, activeCategory === cat ? styles.chipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {query ? `Results for "${query}"` : activeCategory ? activeCategory : 'Featured'}
            </h2>
            {(query || activeCategory) && (
              <button type="button" className={styles.sectionAction} onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>No products match &ldquo;{query}&rdquo;.</div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((product) => (
                <article key={product.id} className={styles.card}>
                  <img src={product.imageUrl} alt="" className={styles.cardImage} />
                  <div className={styles.cardBody}>
                    <span className={styles.cardCategory}>{product.category}</span>
                    <h3 className={styles.cardLabel}>{product.label}</h3>
                    <span className={styles.cardPrice}>${product.price}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className={styles.bottomNav}>
        <button type="button" className={[styles.navItem, styles.navItemActive].join(' ')}>
          <span className={styles.navIcon}>
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false">
              <path
                d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Home
        </button>
        <button type="button" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false">
              <circle cx="9" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M13 13l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Browse
        </button>
        <button type="button" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false">
              <path
                d="M6 6V4a4 4 0 0 1 8 0v2M5 6h10l1 10H4L5 6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Cart
        </button>
        <button type="button" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false">
              <circle cx="10" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M4 17a6 6 0 0 1 12 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Account
        </button>
      </nav>
    </div>
  )
}

const meta = {
  title: 'Examples/Mobile Retail App',
  component: MobileRetailDemo,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'iphone14pro',
    },
    docs: {
      description: {
        component:
          'The SearchInput integrated into a mobile app shell. The search bar ' +
          'lives in a sticky header above a scrollable product list, demonstrating ' +
          'that the portaled dropdown anchors correctly even when the input is ' +
          'inside a fixed-position or non-scrolling ancestor.',
      },
    },
  },
} satisfies Meta<typeof MobileRetailDemo>

export default meta
type Story = StoryObj<typeof meta>

export const MobileHomepage: Story = {}
