/**
 * A contiguous segment of text, either matching or not matching the query.
 * Returned by `highlightMatch` for the rendering layer to map over.
 */
export interface HighlightSegment {
  text: string
  match: boolean
}

/**
 * Splits `text` into segments, marking every case-insensitive occurrence
 * of `query`. Designed for rendering matched substrings with a highlight style.
 *
 * - Returns a single unmatched segment when the query is empty or not found.
 * - Handles multiple matches in the same string.
 * - Does not trim the text (only the query), preserving leading/trailing spaces
 *   in the rendered output.
 *
 * @example
 * highlightMatch('iPhone 15 Pro', 'phone')
 * // → [
 * //     { text: 'i', match: false },
 * //     { text: 'Phone', match: true },
 * //     { text: ' 15 Pro', match: false }
 * //   ]
 */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const trimmedQuery = query.trim()

  if (!trimmedQuery || !text) {
    return [{ text, match: false }]
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmedQuery.toLowerCase()

  const segments: HighlightSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor)

    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor), match: false })
      break
    }

    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), match: false })
    }

    segments.push({
      text: text.slice(matchIndex, matchIndex + trimmedQuery.length),
      match: true
    })

    cursor = matchIndex + trimmedQuery.length
  }

  return segments.length > 0 ? segments : [{ text, match: false }]
}