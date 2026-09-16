import { useCallback, useMemo, useRef, useState } from 'react'
import { useCombobox } from 'downshift'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useFloating,
  useMergeRefs
} from '@floating-ui/react'
import { useSearchSuggestions } from './hooks/useSearchSuggestions'
import { useRecentSearches } from './hooks/useRecentSearches'
import { SuggestionsList } from './subcomponents/SuggestionsList'
import { ClearButton } from './subcomponents/ClearButton'
import type { FlatItem, SearchInputProps } from './types'
import styles from './SearchInput.module.css'

export function SearchInput({
  suggestions: staticSuggestions,
  fetchSuggestions,
  debounceMs = 300,
  minQueryLength = 2,
  maxRecentSearches = 5,
  recentSearchesKey,
  limit = 10,
  showRecentSearches = true,
  onSearch,
  onSelect,
  onChange,
  placeholder = 'Search…',
  emptyMessage,
  loadingMessage,
  recentSearchesLabel,
  suggestionsLabel,
  renderSuggestion,
  renderLeadingIcon,
  className,
  style,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Data sources ────────────────────────────────────────────────────────
  const suggestionsState = useSearchSuggestions({
    query: inputValue,
    suggestions: staticSuggestions,
    fetchSuggestions,
    debounceMs,
    minQueryLength,
    limit
  })

  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  } = useRecentSearches({
    storageKey: recentSearchesKey,
    maxItems: maxRecentSearches
  })

  // ─── Flat items for Downshift ────────────────────────────────────────────
  // Order matches render order: recents first, then suggestions.
  // Reference identity is preserved so Downshift can match selected items.
  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = []
    if (showRecentSearches) {
      for (const recent of recentSearches) {
        items.push({
          kind: 'recent',
          id: recent.id,
          label: recent.label,
          data: recent
        })
      }
    }
    if (suggestionsState.status === 'success') {
      for (const suggestion of suggestionsState.suggestions) {
        items.push({
          kind: 'suggestion',
          id: suggestion.id,
          label: suggestion.label,
          data: suggestion
        })
      }
    }
    return items
  }, [recentSearches, suggestionsState, showRecentSearches])

  // ─── Downshift ───────────────────────────────────────────────────────────
  const {
    isOpen,
    highlightedIndex,
    getInputProps,
    getItemProps,
    getMenuProps,
    closeMenu
  } = useCombobox<FlatItem>({
    id,
    items: flatItems,
    inputValue,
    itemToString: (item) => item?.label ?? '',
    onInputValueChange: ({ inputValue: next = '' }) => {
      setInputValue(next)
      onChange?.(next)
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) return
      const label = selectedItem.label.trim()
      if (!label) return

      addRecentSearch(label)

      if (selectedItem.kind === 'recent') {
        onSearch?.(label, 'recent')
      } else {
        onSelect?.(selectedItem.data)
        onSearch?.(label, 'suggestion')
      }

      closeMenu()
    }
  })

  // ─── Floating UI ─────────────────────────────────────────────────────────
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) closeMenu()
    },
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          // Match dropdown width to the input wrapper
          elements.floating.style.minWidth = `${rects.reference.width}px`
        },
        padding: 8
      })
    ]
  })

  // useMergeRefs handles double-ref problem
  // Destructure ref out of Downshift's returned props and merge our own ref, then spread the rest
  const { ref: downshiftMenuRef, ...menuProps } = getMenuProps()
  const mergedMenuRef = useMergeRefs([downshiftMenuRef, refs.setFloating])

    const { ref: downshiftInputRef, onKeyDown: downshiftKeyDown, ...inputProps } = getInputProps()
    const mergedInputRef = useMergeRefs([downshiftInputRef, inputRef])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter with nothing highlighted submits the typed query
      if (event.key === 'Enter' && highlightedIndex < 0) {
        const trimmed = inputValue.trim()
        if (trimmed) {
          event.preventDefault()
          addRecentSearch(trimmed)
          onSearch?.(trimmed, 'typed')
          closeMenu()
        }
      }
    },
    [highlightedIndex, inputValue, addRecentSearch, onSearch, closeMenu]
  )

    const composedKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    downshiftKeyDown?.(event)
    if (event.defaultPrevented) return
    handleKeyDown(event)
    }

  const handleClear = useCallback(() => {
    setInputValue('')
    onChange?.('')
    closeMenu()
    inputRef.current?.focus()
  }, [onChange, closeMenu])

  // ─── Derived render state ────────────────────────────────────────────────
  const suggestionItems =
    suggestionsState.status === 'success' ? suggestionsState.suggestions : []

  const highlightedRecentIndex =
    highlightedIndex >= 0 && highlightedIndex < recentSearches.length
      ? highlightedIndex
      : -1

  const highlightedSuggestionIndex =
    highlightedIndex >= recentSearches.length
      ? highlightedIndex - recentSearches.length
      : -1

  const showClearButton = inputValue.length > 0 && !disabled

  const getItemPropsForList = useCallback(
    ({ index }: { index: number }) => {
      const item = flatItems[index]
      if (!item) return {}
      return getItemProps({ item, index })
    },
    [flatItems, getItemProps]
  )

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={refs.setReference}
      className={[styles.container, className].filter(Boolean).join(' ')}
      style={style}
    >
        <div className={styles.inputWrapper}>
            {renderLeadingIcon !== null && (
            <span className={styles.leadingIcon} aria-hidden="true">
                {renderLeadingIcon ? renderLeadingIcon() : <DefaultSearchIcon />}
            </span>
            )}

            <input
            // getInputProps returns props and a ref, destructure here then use mergedInputRef instead
            {...inputProps}
            {...{
                'aria-label': ariaLabel,
                'aria-labelledby': ariaLabelledBy,
                'aria-describedby': ariaDescribedBy
            }}
            ref={mergedInputRef}
            className={styles.input}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            onKeyDown={composedKeyDown}
            />

            {showClearButton && (
            <ClearButton onClick={handleClear} className={styles.clearButton} />
            )}
        </div>

        <FloatingPortal>
            {isOpen && (
                <div
                {...menuProps}
                ref={mergedMenuRef}
                style={floatingStyles}
                className={styles.dropdown}
                data-state="open"
                >
                    <SuggestionsList
                        recentSearches={recentSearches}
                        suggestions={suggestionItems}
                        query={inputValue}
                        isLoading={suggestionsState.status === 'loading'}
                        error={
                        suggestionsState.status === 'error'
                            ? suggestionsState.error
                            : null
                        }
                        highlightedRecentIndex={highlightedRecentIndex}
                        highlightedSuggestionIndex={highlightedSuggestionIndex}
                        onRemoveRecent={removeRecentSearch}
                        onClearRecents={clearRecentSearches}
                        renderSuggestion={renderSuggestion}
                        emptyMessage={emptyMessage}
                        loadingMessage={loadingMessage}
                        recentSearchesLabel={recentSearchesLabel}
                        suggestionsLabel={suggestionsLabel}
                        showRecentSearches={showRecentSearches}
                        getItemProps={getItemPropsForList}
                    />
                </div>
            )}
        </FloatingPortal>
    </div>
  )
}

function DefaultSearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}