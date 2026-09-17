import type { ButtonHTMLAttributes } from 'react'
import styles from '../SearchInput.module.css'

export interface ClearButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible label. Default: 'Clear search'. */
  label?: string
}

/**
 * The "×" button inside the search input. Renders as a button with
 * type="button" to prevent accidental form submission.
 */
export function ClearButton({
  label = 'Clear search',
  className,
  ...props
}: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={[styles.clearButton, className].filter(Boolean).join(' ')}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        focusable="false"
      >
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>
  )
}