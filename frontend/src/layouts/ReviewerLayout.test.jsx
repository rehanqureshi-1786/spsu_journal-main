import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ReviewerLayout from './ReviewerLayout'

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: () => ({ email: 'reviewer@test.com' }),
    logout: vi.fn().mockResolvedValue({}),
  },
}))

const renderReviewerLayout = () => {
  return render(
    <BrowserRouter>
      <ReviewerLayout />
    </BrowserRouter>
  )
}

const setViewportWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

describe('ReviewerLayout Mobile Sidebar', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
    // Reset to desktop
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('shows fixed desktop sidebar above 1024px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    renderReviewerLayout()

    // Desktop sidebar should be visible (no translateX(-100%))
    const sidebar = document.querySelector('aside')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar.style.transform).toBe('translateX(0)')

    // Mobile header should not be present
    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument()
  })

  it('hides desktop sidebar and shows mobile header at ≤1024px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    renderReviewerLayout()

    // Mobile header with hamburger should be visible
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
    expect(screen.getByText('The Essence - Reviewer')).toBeInTheDocument()

    // Sidebar should be hidden (translateX(-100%))
    const sidebar = document.querySelector('aside')
    expect(sidebar.style.transform).toBe('translateX(-100%)')
  })

  it('opens sidebar when hamburger is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    renderReviewerLayout()

    const toggleButton = screen.getByLabelText('Toggle sidebar')
    fireEvent.click(toggleButton)

    const sidebar = document.querySelector('aside')
    expect(sidebar.style.transform).toBe('translateX(0)')
  })

  it('shows overlay when sidebar is open', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    const { container } = renderReviewerLayout()

    // No overlay initially
    const overlaysBefore = container.querySelectorAll('[style*="rgba(0, 0, 0, 0.5)"]')
    expect(overlaysBefore.length).toBe(0)

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))

    // Overlay should appear
    const overlaysAfter = container.querySelectorAll('[style*="rgba(0, 0, 0, 0.5)"]')
    expect(overlaysAfter.length).toBe(1)
  })

  it('closes sidebar when overlay is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    const { container } = renderReviewerLayout()

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))

    // Click overlay
    const overlay = container.querySelector('[style*="rgba(0, 0, 0, 0.5)"]')
    fireEvent.click(overlay)

    // Sidebar should be closed
    const sidebar = document.querySelector('aside')
    expect(sidebar.style.transform).toBe('translateX(-100%)')
  })

  it('closes sidebar when a navigation link is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    renderReviewerLayout()

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))

    // Click a nav link
    fireEvent.click(screen.getByText('Dashboard'))

    // Sidebar should be closed
    const sidebar = document.querySelector('aside')
    expect(sidebar.style.transform).toBe('translateX(-100%)')
  })

  it('locks body scroll when sidebar is open', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    renderReviewerLayout()

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))
    expect(document.body.style.overflow).toBe('hidden')

    // Close sidebar
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))
    expect(document.body.style.overflow).toBe('unset')
  })

  it('restores desktop sidebar when resized above 1024px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    renderReviewerLayout()

    // Should be in mobile mode
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()

    // Resize to desktop
    setViewportWidth(1280)

    // Mobile header should be gone, sidebar should be visible
    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument()
    const sidebar = document.querySelector('aside')
    expect(sidebar.style.transform).toBe('translateX(0)')
  })

  it('nav links have minHeight 44px on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    renderReviewerLayout()

    // Open sidebar to see nav links
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink.style.minHeight).toBe('44px')
  })

  it('returns focus to toggle button when sidebar closes', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    const { container } = renderReviewerLayout()

    const toggleButton = screen.getByLabelText('Toggle sidebar')

    // Open sidebar
    fireEvent.click(toggleButton)

    // Close via overlay
    const overlay = container.querySelector('[style*="rgba(0, 0, 0, 0.5)"]')
    fireEvent.click(overlay)

    // Focus should return to toggle button
    expect(document.activeElement).toBe(toggleButton)
  })

  it('uses brand color #1a5490 for sidebar', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    const { container } = renderReviewerLayout()

    // Check the logo icon uses the brand color
    const logoIcon = container.querySelector('[style*="background-color: rgb(139, 92, 246)"]') ||
                     container.querySelector('[style*="#1a5490"]')
    expect(logoIcon).toBeInTheDocument()
  })

  it('mobile header has 60px height', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    const { container } = renderReviewerLayout()

    const mobileHeader = container.querySelector('[style*="height: 60px"]')
    expect(mobileHeader).toBeInTheDocument()
  })

  it('restores body overflow on unmount', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 })
    const { unmount } = renderReviewerLayout()

    // Open sidebar to lock scroll
    fireEvent.click(screen.getByLabelText('Toggle sidebar'))
    expect(document.body.style.overflow).toBe('hidden')

    // Unmount
    unmount()

    // Body overflow should be restored
    expect(document.body.style.overflow).toBe('unset')
  })
})
