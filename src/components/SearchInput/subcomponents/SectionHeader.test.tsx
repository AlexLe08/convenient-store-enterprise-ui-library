import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SectionHeader } from './SectionHeader'

describe('SectionHeader', () => {
  it('renders the label text', () => {
    render(<SectionHeader>Recent Searches</SectionHeader>)
    expect(screen.getByText('Recent Searches')).toBeInTheDocument()
  })

  it('renders with role="presentation"', () => {
    render(<SectionHeader>Suggestions</SectionHeader>)
    const header = screen.getByText('Suggestions').closest('li')
    expect(header).toHaveAttribute('role', 'presentation')
  })

  it('does not render an action button when no action is provided', () => {
    render(<SectionHeader>Suggestions</SectionHeader>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders and fires the action button', async () => {
    const onAction = vi.fn()
    render(
      <SectionHeader actionLabel="Clear all" onAction={onAction}>
        Recent Searches
      </SectionHeader>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('does not lose focus on the action button mousedown', async () => {
    const onAction = vi.fn()
    render(
      <>
        <input data-testid="search" />
        <ul>
          <SectionHeader actionLabel="Clear all" onAction={onAction}>
            Recent
          </SectionHeader>
        </ul>
      </>
    )

    const input = screen.getByTestId('search')
    input.focus()
    expect(input).toHaveFocus()

    // Simulate a raw mousedown (the event that would normally blur the input)
    const button = screen.getByRole('button', { name: 'Clear all' })
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    button.dispatchEvent(event)

    // The preventDefault should have cancelled the default blur behavior
    expect(event.defaultPrevented).toBe(true)
  })
})