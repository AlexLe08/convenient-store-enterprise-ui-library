import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
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
    // Downshift v9 fires a spurious dev-mode warning when the menu is
    // rendered through a portal. The ref is applied correctly — the
    // warning is a timing artifact of Downshift's internal effect check.
    // Our outside-click dismissal doesn't rely on Downshift's hook.
    // See: https://github.com/downshift-js/downshift/issues/1505
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

    // ─── Outside-click dismissal ─────────────────────────────────────────────
    // Downshift v9's built-in click-outside hook does not reliably register
    // when the menu is portaled. We handle it directly using Floating UI's
    // ref objects, which point at the container and the dropdown wrapper.
    useEffect(() => {
        if (!isOpen) return

        function handleMouseDown(event: MouseEvent) {
            const target = event.target as Node

            // Floating UI's ref obj, holds outer .container div that wraps input and clear button; clicking anything here is "inside"
            const inContainer =
            refs.reference.current instanceof Element &&
            refs.reference.current.contains(target)

            // other ref obj, holds dropdown wrapper inside portal. Clicking any option is "inside"
            const inDropdown =
            refs.floating.current instanceof Element &&
            refs.floating.current.contains(target)

            // any click outside these two objs =  "outside" so close it
            if (!inContainer && !inDropdown) {
            closeMenu()
            }
        }

        // mousedown fires before focus changes
        // If we listened for click, the input would blur first, then the outside handler would run — creating a race where the menu flickers closed and the click lands on whatever's behind it.
        document.addEventListener('mousedown', handleMouseDown)
        return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [isOpen, closeMenu, refs])

    const menuProps = getMenuProps()

    const { ref: downshiftInputRef, onKeyDown: downshiftKeyDown, ...inputProps } = getInputProps()
    const mergedInputRef = useMergeRefs([downshiftInputRef, inputRef])

  // ─── Handlers ────────────────────────────────────────────────────────────
    // Downshift's default for "Enter with no highlight" is to close the menu silently. That's a perfectly reasonable default for a generic combobox, but it's not what we want for a search bar — we want the typed query to be submitted. Intercepting before Downshift gives us deterministic behavior and avoids preventDefault ordering games.
  // Enter with a highlight still goes to Downshift, which fires onSelectedItemChange for the suggestion. Arrow keys, Escape, Home/End all still go to Downshift unchanged.
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
          return
        }
      }
      downshiftKeyDown?.(event)
    },
    [highlightedIndex, inputValue, addRecentSearch, onSearch, closeMenu, downshiftKeyDown]
  )



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

const showDropdown = isOpen && (recentSearches.length > 0 ||
    suggestionsState.status === 'loading' ||
    suggestionsState.status === 'error' ||
    suggestionsState.status === 'success')

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
            onKeyDown={handleKeyDown}
            />

            {showClearButton && (
            <ClearButton onClick={handleClear} className={styles.clearButton} />
            )}
        </div>

        <FloatingPortal>
            {showDropdown && (
                // Downshift needs its ref on the element that plays the role="listbox" semantic role. Floating UI needs its ref on the element it positions. 
                <div ref={refs.setFloating} style={floatingStyles}>
                    <div
                    {...menuProps}
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