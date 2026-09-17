# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-17

### Added

- `SearchInput` component with autosuggest, recent searches, and full keyboard navigation
- `useSearchSuggestions` hook — debounced fuzzy matching (Fuse.js) and async fetcher support with race-condition safety
- `useRecentSearches` hook — localStorage persistence, case-insensitive deduplication, configurable cap
- `useDebounce` generic utility hook
- `highlightMatch` text segmentation utility
- Full ARIA combobox pattern: `role="combobox"`, `aria-activedescendant`, `aria-expanded`, `aria-controls`
- Keyboard support: arrow keys, Enter, Escape, Tab (commit-on-highlight), Home/End
- Subcomponents: `SuggestionsList`, `SuggestionItem`, `HighlightedText`, `SectionHeader`, `ClearButton`, `LoadingIndicator`
- Storybook: 8 component states plus desktop and mobile retail demos
- Test suite: 89 tests across hooks, utilities, subcomponents, and integration
- Chromatic visual regression workflow
- GitHub Actions CI: `check` (lint + typecheck + test) and `chromatic`
- Bundle size report and package content verification scripts

### Design decisions

- Discriminated-union state machine for suggestions instead of boolean flags
- Race-condition safety in async fetching via `AbortController` + monotonic request IDs
- Portal-rendered dropdown to escape ancestor `overflow` and stacking contexts
- `size` middleware constrains dropdown height rather than `flip` moving it above the input
- Tab commits the highlighted item; Enter with no highlight submits the typed query

[Unreleased]: https://github.com/AlexLe08/convenient-store-enterprise-ui-library/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AlexLe08/convenient-store-enterprise-ui-library/releases/tag/v0.1.0
