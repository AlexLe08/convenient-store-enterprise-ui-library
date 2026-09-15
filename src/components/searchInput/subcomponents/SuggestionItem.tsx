import { forwardRef, type LiHTMLAttributes, type ReactNode } from 'react'
import { HighlightedText } from './HighlightedText'
import { ClearButton } from './ClearButton'
import type { DropdownItemKind } from '../types'
import styles from '../SearchInput.module.css'

export interface SuggestionItemProps
  extends Omit<LiHTMLAttributes<HTMLLIElement>, 'onSelect' | 'children'> {
  /** Discriminates styling and default iconography. */
  kind: DropdownItemKind
  /** Display text. */
  label: string
  /** Current query — used to highlight matching substrings. */
  query?: string
  /** Whether this item is keyboard-focused. Applied as a data attribute for CSS. */
  isHighlighted?: boolean
  /** Override the leading icon entirely. Pass `null` to hide. */
  leadingIcon?: ReactNode
  /**
   * Called when the user clicks the remove button.
   * Only rendered when `kind === 'recent'` and this callback is provided.
   */
  onRemove?: () => void
  /** Accessible label for the remove button. */
  removeLabel?: string
  /**
   * Fully custom content renderer. When provided, `label` and `query`
   * are ignored for rendering, but `label` is still used as a default
   * `aria-label`.
   */
  renderContent?: (label: string) => ReactNode
}

/**
 * A single actionable row in the dropdown.
 *
 * Forwards its ref to the underlying `<li>` so Downshift can attach
 * the element reference from `getItemProps`.
 */
export const SuggestionItem = forwardRef<HTMLLIElement, SuggestionItemProps>(
  function SuggestionItem(
    {
      kind,
      label,
      query = '',
      isHighlighted = false,
      leadingIcon,
      onRemove,
      removeLabel = 'Remove',
      renderContent,
      className,
      ...rest
    },
    ref
  ) {
    const showRemove = kind === 'recent' && typeof onRemove === 'function'

    const resolvedIcon =
      leadingIcon !== undefined ? leadingIcon : <DefaultIcon kind={kind} />

    return (
      <li
        ref={ref}
        data-highlighted={isHighlighted ? 'true' : undefined}
        className={[styles.suggestionItem, className].filter(Boolean).join(' ')}
        {...rest}
      >
        {resolvedIcon && (
          <span className={styles.suggestionIcon} aria-hidden="true">
            {resolvedIcon}
          </span>
        )}

        <span className={styles.suggestionLabel}>
          {renderContent ? (
            renderContent(label)
          ) : (
            <HighlightedText
              text={label}
              query={query}
              className={styles.highlightedText}
            />
          )}
        </span>

        {showRemove && (
          <ClearButton
            label={removeLabel}
            className={styles.suggestionRemove}
            // Prevent the parent's click handler from also firing
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          />
        )}
      </li>
    )
  }
)

function DefaultIcon({ kind }: { kind: DropdownItemKind }) {
  if (kind === 'recent') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}