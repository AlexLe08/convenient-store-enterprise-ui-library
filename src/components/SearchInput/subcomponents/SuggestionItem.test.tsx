import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { SuggestionItem } from './SuggestionItem'

describe('SuggestionItem', () => {
  it('renders the label', () => {
    render(<SuggestionItem kind="suggestion" label="iPhone 15" />)
    expect(screen.getByText(/iPhone/)).toBeInTheDocument()
  })

  it('highlights the matching substring', () => {
    render(<SuggestionItem kind="suggestion" label="iPhone 15" query="phone" />)
    expect(document.querySelector('mark')).toHaveTextContent('Phone')
  })

  it('applies data-highlighted when isHighlighted is true', () => {
    const { container } = render(
      <SuggestionItem kind="suggestion" label="iPhone" isHighlighted />
    )
    const li = container.querySelector('li')
    expect(li).toHaveAttribute('data-highlighted', 'true')
  })

  it('omits data-highlighted when isHighlighted is false', () => {
    const { container } = render(
      <SuggestionItem kind="suggestion" label="iPhone" isHighlighted={false} />
    )
    expect(container.querySelector('li')).not.toHaveAttribute('data-highlighted')
  })

  it('renders a remove button only for recent items with onRemove', () => {
    const { rerender } = render(
      <SuggestionItem kind="suggestion" label="iPhone" onRemove={vi.fn()} />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<SuggestionItem kind="recent" label="iPhone" onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('calls onRemove and stops propagation', async () => {
    const onRemove = vi.fn()
    const onItemClick = vi.fn()
    render(
      <SuggestionItem
        kind="recent"
        label="iPhone"
        onRemove={onRemove}
        onClick={onItemClick}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onItemClick).not.toHaveBeenCalled()
  })

  it('uses renderContent when provided', () => {
    render(
      <SuggestionItem
        kind="suggestion"
        label="iPhone"
        renderContent={(label) => <span data-testid="custom">{label}!</span>}
      />
    )
    expect(screen.getByTestId('custom')).toHaveTextContent('iPhone!')
    // No highlighted <mark> when using custom content
    expect(document.querySelector('mark')).toBeNull()
  })

  it('hides the default icon when leadingIcon is null', () => {
    const { container } = render(
      <SuggestionItem kind="suggestion" label="iPhone" leadingIcon={null} />
    )
    expect(container.querySelector('svg')).toBeNull()
  })

  it('forwards its ref to the underlying <li>', () => {
    const ref = createRef<HTMLLIElement>()
    render(<SuggestionItem ref={ref} kind="suggestion" label="iPhone" />)
    expect(ref.current).toBeInstanceOf(HTMLLIElement)
  })

  it('applies a custom className alongside the base class', () => {
    const { container } = render(
      <SuggestionItem kind="suggestion" label="iPhone" className="custom" />
    )
    expect(container.querySelector('li')).toHaveClass('custom')
  })
})