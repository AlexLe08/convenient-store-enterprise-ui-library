[![Chromatic](https://img.shields.io/badge/Storybook-live%20preview-ff4785?logo=storybook)](https://main--6aab131bbd9144d2d7017827.chromatic.com/)

# Convenient Store Enterprise UI Library

A production-grade React component library demonstrating enterprise search UX patterns — autosuggest, recent searches, fuzzy matching, and full keyboard accessibility — built with a modern toolchain and comprehensive test coverage.

> **Note:** This is a portfolio project inspired by my experience building a component library at a large retain enterprise. It is not published to npm. The project reflects how I approach development, testing, and shipping with high standards for accessibility and developer experience.
>
> It is **not** a fork or mirror of my former employer's  code. Everything here is written from scratch, using modern packages and patterns that showcase both my past and present-day skills.

---

## Why This Exists

Enterprise retail search bars share a set of UX patterns that I wanted to recreate myself:

- **Autosuggest with fuzzy matching** — "iphon" should surface "iPhone 15 Pro"
- **Recent searches** — persisted per user, deduped, ordered by recency
- **Sectioned dropdown** — "Recent Searches" and "Suggestions" rendered distinctly
- **Full keyboard navigation** — arrow keys, Enter, Escape, Tab all behave predictably
- **Complete ARIA support** — `combobox`, `listbox`, `aria-activedescendant` at every step

This library implements all of it as a single, composable component with hooks that can be reused independently.

---

## What's Inside

```
src/
├── components/
│   └── SearchInput/
│       ├── SearchInput.tsx              # Main component — Downshift + Floating UI
│       ├── SearchInput.module.css       # Scoped styles
│       ├── SearchInput.test.tsx         # Integration tests
│       ├── SearchInput.stories.tsx      # Storybook stories (8 states)
│       ├── types.ts                     # Public prop types
│       ├── hooks/
│       │   ├── useSearchSuggestions.ts  # Debounced fetch + fuzzy match
│       │   └── useRecentSearches.ts     # localStorage-backed recents
│       └── subcomponents/
│           ├── SuggestionsList.tsx
│           ├── SuggestionItem.tsx
│           ├── HighlightedText.tsx
│           ├── SectionHeader.tsx
│           ├── ClearButton.tsx
│           └── LoadingIndicator.tsx
├── hooks/
│   └── useDebounce.ts                   # Generic debounce
├── types/
│   └── search.ts                        # Shared domain types
└── utils/
    └── highlightMatch.ts                # Text segmentation for highlighting
```

**Total:** ~27 source files, 89 tests, 100% coverage on hooks and utilities, ~95% coverage total.

---

## Tech Stack & Rationale

| Choice | Why |
|--------|-----|
| **Vite (library mode)** | Fast builds, native ESM, correct tree-shaking. Next.js is the wrong tool — it produces app bundles, not library artifacts. |
| **Downshift v9** | Battle-tested combobox primitive. Handles the ARIA state machine so we don't have to. |
| **Floating UI** | Popover positioning with `flip`, `shift`, and `size` middleware. Handles viewport edge cases that naive `position: absolute` misses. |
| **Fuse.js** | Client-side fuzzy matching. Replaces a backend search index for the static-suggestions use case. |
| **CSS Modules** | Zero runtime cost. No CSS-in-JS overhead in consumer bundles. Scoped by default. |
| **Vitest + Testing Library** | Fast, jsdom-based, familiar API. Paired with `@testing-library/user-event` for realistic interaction tests. |
| **Storybook 7** | Component documentation, visual state coverage, and a deployable preview for reviewers. |

---

## Quick Start

# Live Preview

The component library is published to Chromatic. Every push to `main` deploys a fresh build:

**→ [View the Storybook](https://main--6aab131bbd9144d2d7017827.chromatic.com)**

No setup required. Click through the eight states, type in the search bar, arrow through the suggestions.

```bash
npm install
npm run storybook      # http://localhost:6006
```

```bash
npm run check          # lint + typecheck + test
npm run build          # produces dist/index.js, dist/index.cjs, dist/index.d.ts, dist/style.css
```

---

## Usage

```tsx
import { SearchInput } from '@alexle/search-input'
import '@alexle/search-input/style.css'

function App() {
  return (
    <SearchInput
      suggestions={[
        { id: '1', label: 'iPhone 15 Pro' },
        { id: '2', label: 'Samsung Galaxy S24' },
        { id: '3', label: 'Google Pixel 8' },
      ]}
      placeholder="Search products…"
      aria-label="Product search"
      onSearch={(query, source) => {
        console.log(`Searched "${query}" via ${source}`)
      }}
      onSelect={(suggestion) => {
        analytics.track('suggestion_selected', { id: suggestion.id })
      }}
    />
  )
}
```

**Async suggestions:**

```tsx
<SearchInput
  fetchSuggestions={async (query, signal) => {
    const res = await fetch(`/api/search?q=${query}`, { signal })
    return res.json()
  }}
  debounceMs={300}
  minQueryLength={2}
/>
```

---

## Key Design Decisions

### 1. Discriminated-union state, not boolean flags

The suggestions hook exposes:

```ts
type SuggestionsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; suggestions: SearchSuggestion[] }
  | { status: 'error'; error: Error }
```

A naïve implementation would use `{ data, isLoading, error }`. The union makes contradictory states impossible (`isLoading && error` can't happen), and TypeScript enforces exhaustive handling at every render site.

### 2. Race-condition safety in async fetching

Rapid typing fires multiple requests. A naïve implementation lets the *last response to arrive* win — which is often the *oldest* query. We solve it two ways:

- **`AbortController`** — cancels the network request when a new one starts.
- **Monotonic request IDs** — a response checks "am I still the latest?" before updating state.

The second is the correctness guarantee; the first is the optimization. Both are covered by tests that simulate out-of-order resolution.

### 3. Enter-with-no-highlight submits the typed query

Downshift's default for "Enter with no highlighted item" is to close silently. For a *search bar*, that's wrong — users expect Enter to *search*. We intercept the keydown **before** Downshift so the behavior is deterministic and doesn't depend on `preventDefault` ordering between handlers.

### 4. Tab commits the highlight

Matches Amazon, Google, and native `<input list>` behavior. Arrowing into the list signals intent; Tab commits and moves focus. If nothing is highlighted, Tab preserves the typed query verbatim. This is documented in an explicit test.

### 5. Portal the dropdown

The dropdown renders through `FloatingPortal` into `document.body`. This escapes ancestor `overflow: hidden`, `transform`, and stacking-context traps that would otherwise clip or misposition it inside real consumer layouts.

### 6. CSS Modules over CSS-in-JS

Zero runtime cost. Consumers import one CSS file. No styled-components dependency, no emotion runtime in the bundle, no hydration edge cases with React 18 concurrent rendering.

---

## Accessibility

Every interaction is covered by the ARIA Authoring Practices combobox pattern:

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `role="combobox"` | Input | Declares the composite widget |
| `aria-expanded` | Input | Reflects dropdown open/closed |
| `aria-controls` | Input | Points to the listbox ID |
| `aria-activedescendant` | Input | Points to the currently highlighted option |
| `role="listbox"` | Dropdown | Declares the option container |
| `role="option"` | Each item | Declares selectable rows |
| `role="presentation"` | Section headers | Prevents headers from being announced as options |
| `role="alert"` | Error state | Announces fetcher errors immediately |

Keyboard support:

| Key | Behavior |
|-----|----------|
| `↓` / `↑` | Move highlight through items, wrapping through recents → suggestions |
| `Enter` | Select highlighted item, or submit typed query if nothing highlighted |
| `Tab` | Commit highlight (if any) and move focus |
| `Escape` | Close dropdown, preserve typed query |
| `Home` / `End` | Jump to first/last item |

Tested via `@testing-library/user-event` — real keystrokes, not synthetic events.

---

## Testing Strategy

89 tests across four layers:

| Layer | Tests | What it covers |
|-------|-------|---------------|
| **Hooks** | 26 | Debounce timing, localStorage hydration, race conditions, aborted requests |
| **Utilities** | 13 | Text segmentation, case preservation, regex-special characters |
| **Subcomponents** | 33 | Rendering, prop forwarding, callback isolation |
| **Component integration** | 17 | Keyboard nav, focus management, click-outside, callbacks, disabled state |

Notable tests:

- **`ignores stale responses when a newer request resolves first`** — simulates out-of-order async resolution and asserts the stale response is discarded.
- **`calls onRemove and stops propagation`** — verifies clicking the remove button on a recent search doesn't also trigger item selection.
- **`moves focus to the clear button after committing on Tab`** — confirms the commit-on-Tab contract end-to-end.
- **`closes the dropdown on mousedown outside the component`** — uses `fireEvent.mouseDown` to test the dismissal path without jsdom's flaky pointer-event emulation.

```bash
npm run test:coverage
```

---

## Notable Problems Solved

Documented here because the *process* matters as much as the outcome:

1. **Node 22's experimental `localStorage` shadows jsdom's.** Node 22.4+ installs a broken `localStorage` stub before jsdom initializes, causing `window.localStorage` to be `undefined` in tests. Fixed with a defensive in-memory `Storage` polyfill in `test-setup.ts`.

2. **Vitest path resolution breaks on spaces in the project path.** Resolved by anchoring Vitest to an explicit `test.root` via `import.meta.url`.

3. **Downshift's menu ref doesn't survive the portal boundary.** Merging refs with `useMergeRefs` caused Downshift's dev-mode check to fail and its click-outside hook to never register. Fixed by splitting the two concerns onto separate DOM elements and implementing outside-click dismissal directly.

4. **ESLint `import/extensions` conflicts with TypeScript conventions.** The rule was designed for Node ESM where extensions are required. In TS, they're forbidden. Disabled the rule and relied on `tsc` for resolution errors.

---

## Scripts

```bash
npm run storybook      # Storybook dev server
npm run build          # Build the library
npm run check          # lint + typecheck + test
npm run test           # Vitest in watch mode
npm run test:coverage  # Coverage report
npm run lint:fix       # Auto-fix lint issues
npm run format         # Prettier
```

---

## License

MIT