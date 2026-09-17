import type { ReactNode } from 'react'
import styles from '../SearchInput.module.css'

export interface SectionHeaderProps {
  /** Header text (e.g., "Recent Searches"). */
  children: ReactNode
  /** Optional action button label (e.g., "Clear all"). */
  actionLabel?: string
  /** Called when the action button is clicked. Only shown if provided. */
  onAction?: () => void
  className?: string
}

/**
 * A non-interactive section header inside the dropdown.
 *
 * Rendered as a `<li role="presentation">` so it lives inside the listbox
 * DOM structure without being announced as an option by screen readers.
 */
export function SectionHeader({
  children,
  actionLabel,
  onAction,
  className
}: SectionHeaderProps) {
  return (
    <li
      role="presentation"
      className={[styles.sectionHeader, className].filter(Boolean).join(' ')}
    >
      <span className={styles.sectionHeaderLabel}>{children}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          className={styles.sectionHeaderAction}
          // Prevent the input from losing focus when the button is clicked
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation()
            onAction()
          }}
        >
          {actionLabel}
        </button>
      )}
    </li>
  )
}