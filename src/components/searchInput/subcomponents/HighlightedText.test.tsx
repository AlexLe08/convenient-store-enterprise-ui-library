import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HighlightedText } from './HighlightedText'

describe('HighlightedText', () => {
  it('renders plain text when the query does not match', () => {
    render(<HighlightedText text="iPhone 15" query="zzz" />)
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(document.querySelector('mark')).toBeNull()
  })

  it('wraps matched substrings in <mark>', () => {
    render(<HighlightedText text="iPhone 15" query="phone" />)
    const marks = document.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('Phone')
  })

  it('preserves original casing in the marked segment', () => {
    render(<HighlightedText text="iPhone 15" query="PHONE" />)
    expect(document.querySelector('mark')).toHaveTextContent('Phone')
  })

  it('renders multiple matches as separate marks', () => {
    render(<HighlightedText text="ab cd ab" query="ab" />)
    expect(document.querySelectorAll('mark')).toHaveLength(2)
  })

  it('honors the `as` prop', () => {
    render(<HighlightedText text="iPhone 15" query="phone" as="strong" />)
    expect(document.querySelector('strong')).toHaveTextContent('Phone')
    expect(document.querySelector('mark')).toBeNull()
  })

  it('applies the className to matched segments only', () => {
    render(
      <HighlightedText text="iPhone 15" query="phone" className="my-highlight" />
    )
    const marked = document.querySelector('mark')
    expect(marked).toHaveClass('my-highlight')
  })

  it('renders the full text content unchanged', () => {
    const { container } = render(<HighlightedText text="iPhone 15 Pro" query="phone" />)
    expect(container.textContent).toBe('iPhone 15 Pro')
  })
})