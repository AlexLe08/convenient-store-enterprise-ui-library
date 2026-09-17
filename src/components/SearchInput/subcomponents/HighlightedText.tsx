import { highlightMatch } from '@/utils/highlightMatch'

export interface HighlightedTextProps {
  /** The full text to render. */
  text: string
  /** The query to highlight within `text`. */
  query: string
  /** Element used for matched segments. Default: 'mark'. */
  as?: 'mark' | 'b' | 'strong' | 'span'
  /** Class applied to matched segments. */
  className?: string
}

/**
 * Renders `text` with case-insensitive occurrences of `query` wrapped
 * in a semantic element (default `<mark>`). Used inside suggestion rows.
 */
export function HighlightedText({
  text,
  query,
  as: Component = 'mark',
  className
}: HighlightedTextProps) {
  const segments = highlightMatch(text, query)

  // Fast path: no matches → render plain text, no wrapper elements.
  if (segments.length === 1 && !segments[0].match) {
    return <>{text}</>
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <Component key={index} className={className}>
            {segment.text}
          </Component>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  )
}