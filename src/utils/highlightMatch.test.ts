import { describe, it, expect } from 'vitest'
import { highlightMatch } from './highlightMatch'

describe('highlightMatch', () => {
  it('returns the whole text as unmatched when the query is empty', () => {
    expect(highlightMatch('iPhone 15', '')).toEqual([
      { text: 'iPhone 15', match: false }
    ])
  })

  it('returns the whole text as unmatched when the query is whitespace', () => {
    expect(highlightMatch('iPhone 15', '   ')).toEqual([
      { text: 'iPhone 15', match: false }
    ])
  })

  it('returns an empty unmatched segment for empty text', () => {
    expect(highlightMatch('', 'phone')).toEqual([{ text: '', match: false }])
  })

  it('returns the whole text as unmatched when there is no match', () => {
    expect(highlightMatch('iPhone 15', 'zzz')).toEqual([
      { text: 'iPhone 15', match: false }
    ])
  })

  it('marks a single substring match', () => {
    expect(highlightMatch('iPhone 15 Pro', 'phone')).toEqual([
      { text: 'i', match: false },
      { text: 'Phone', match: true },
      { text: ' 15 Pro', match: false }
    ])
  })

  it('matches case-insensitively but preserves original casing', () => {
    expect(highlightMatch('iPhone', 'IPHONE')).toEqual([
      { text: 'iPhone', match: true }
    ])
  })

  it('handles a match at the start of the string', () => {
    expect(highlightMatch('iPhone 15', 'iPhone')).toEqual([
      { text: 'iPhone', match: true },
      { text: ' 15', match: false }
    ])
  })

  it('handles a match at the end of the string', () => {
    expect(highlightMatch('iPhone 15', '15')).toEqual([
      { text: 'iPhone ', match: false },
      { text: '15', match: true }
    ])
  })

  it('handles a match spanning the whole string', () => {
    expect(highlightMatch('iPhone', 'iphone')).toEqual([
      { text: 'iPhone', match: true }
    ])
  })

  it('marks multiple non-adjacent matches', () => {
    expect(highlightMatch('ab cd ab', 'ab')).toEqual([
      { text: 'ab', match: true },
      { text: ' cd ', match: false },
      { text: 'ab', match: true }
    ])
  })

  it('handles adjacent matches without merging them', () => {
    expect(highlightMatch('abab', 'ab')).toEqual([
      { text: 'ab', match: true },
      { text: 'ab', match: true }
    ])
  })

  it('trims whitespace from the query before matching', () => {
    expect(highlightMatch('iPhone 15', '  phone  ')).toEqual([
      { text: 'i', match: false },
      { text: 'Phone', match: true },
      { text: ' 15', match: false }
    ])
  })

  it('escapes regex-special characters without throwing', () => {
    expect(highlightMatch('price: $99', '$99')).toEqual([
      { text: 'price: ', match: false },
      { text: '$99', match: true }
    ])
  })
})