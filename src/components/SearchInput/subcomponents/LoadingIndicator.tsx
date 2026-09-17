import styles from '../SearchInput.module.css'

export interface LoadingIndicatorProps {
  /** Visible message. Also used as the aria-live announcement. Default: 'Loading…' */
  message?: string
}

/**
 * Accessible loading spinner shown while suggestions are fetching.
 * Uses role="status" so screen readers announce the state change once,
 * not on every render.
 */
export function LoadingIndicator({ message = 'Loading…' }: LoadingIndicatorProps) {
  return (
    <div className={styles.loadingIndicator} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.loadingMessage}>{message}</span>
    </div>
  )
}