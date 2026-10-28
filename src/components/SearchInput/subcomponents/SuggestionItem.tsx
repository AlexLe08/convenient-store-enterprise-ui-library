import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { HighlightedText } from './HighlightedText'
import type { DropdownItemKind } from '../types'
import styles from '../SearchInput.module.css'

export interface SuggestionItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
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
export const SuggestionItem = forwardRef<HTMLDivElement, SuggestionItemProps>(
  function SuggestionItem(
    {
      kind,
      label,
      query = '',
      isHighlighted = false,
      leadingIcon,
      renderContent,
      className,
      ...rest
    },
    ref
  ) {
    const resolvedIcon = leadingIcon !== undefined ? leadingIcon : <DefaultIcon kind={kind} />

    return (
      <li
        role="presentation"
        data-highlighted={isHighlighted ? 'true' : undefined}
        className={[styles.suggestionRow, className].filter(Boolean).join(' ')}
      >
        <div ref={ref} role="option" className={styles.suggestionItem} {...rest} aria-label={label}>
          {resolvedIcon && (
            <span className={styles.suggestionIcon} aria-hidden="true">
              {resolvedIcon}
            </span>
          )}

          <span className={styles.suggestionLabel}>
            {renderContent ? (
              renderContent(label)
            ) : (
              <HighlightedText text={label} query={query} className={styles.highlightedText} />
            )}
          </span>
        </div>
      </li>
    )
  }
)

function DefaultIcon({ kind }: { kind: DropdownItemKind }) {
  if (kind === 'recent') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M8 4.5V8l2.5 1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
