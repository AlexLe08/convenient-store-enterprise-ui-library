import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SearchInput } from '@/components/SearchInput/SearchInput'
import { PRODUCTS, SUGGESTIONS, CATEGORIES } from './shared/products'
import styles from './RetailSearchDemo.module.css'

function RetailDemo() {
  const [activeQuery, setActiveQuery] = useState('')

  const filtered = activeQuery
    ? PRODUCTS.filter((p) => p.label.toLowerCase().includes(activeQuery.toLowerCase()))
    : PRODUCTS

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>CS</span>
          <span className={styles.brandName}>Convenient Store</span>
        </div>
        <nav className={styles.nav}>
          <a href="#deals">Deals</a>
          <a href="#new">New Arrivals</a>
          <a href="#support">Support</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Find what you need, fast.</h1>
        <p className={styles.heroSubtitle}>
          Search across thousands of products. Type to see suggestions, browse your recent searches,
          or pick from featured categories.
        </p>

        <div className={styles.searchWrapper}>
          <SearchInput
            suggestions={SUGGESTIONS}
            placeholder="Search products…"
            aria-label="Search products"
            minQueryLength={1}
            recentSearchesKey="cs-ui:demo-recents"
            onSearch={(query) => setActiveQuery(query)}
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
        </div>

        <div className={styles.chips}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={styles.chip}
              onClick={() => setActiveQuery(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {activeQuery ? `Results for "${activeQuery}"` : 'Featured Products'}
          </h2>
          {activeQuery && (
            <button
              type="button"
              className={styles.clearResults}
              onClick={() => setActiveQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No products match &ldquo;{activeQuery}&rdquo;.</p>
            <button
              type="button"
              className={styles.clearResults}
              onClick={() => setActiveQuery('')}
            >
              Show all products
            </button>
          </div>
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
  )
}

const meta = {
  title: 'Examples/Retail Homepage',
  component: RetailDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The SearchInput integrated into a realistic retail homepage. ' +
          'Demonstrates the component in situ: branded header, hero section, ' +
          'category chips, and a product grid that reacts to committed searches. ' +
          'Try typing "iphone", selecting a suggestion, or clicking a category chip.',
      },
    },
  },
} satisfies Meta<typeof RetailDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Homepage: Story = {}
