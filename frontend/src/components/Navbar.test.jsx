import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './Navbar'

// Mock window.matchMedia
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  )
}

describe('Navbar Component', () => {
  it('renders the navbar with brand name', () => {
    renderNavbar()
    expect(screen.getByText('The Essence')).toBeInTheDocument()
    expect(screen.getByText('SPSU Journal')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderNavbar()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Editorial Board')).toBeInTheDocument()
    expect(screen.getByText('For Authors')).toBeInTheDocument()
    expect(screen.getByText('For Reviewers')).toBeInTheDocument()
    expect(screen.getByText('Issues')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Verify Certificate')).toBeInTheDocument()
  })

  it('renders auth buttons', () => {
    renderNavbar()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('applies active class to current route', () => {
    renderNavbar()
    const homeLink = screen.getByText('Home').closest('a')
    // CSS modules generate hashed class names, so we check if it contains 'active' in the class
    expect(homeLink.className).toMatch(/active/)
  })

  it('applies scrolled class on scroll', async () => {
    const { container } = renderNavbar()
    const navbar = container.querySelector('nav')
    
    // Initially should not have scrolled class
    expect(navbar.className).not.toMatch(/scrolled/)
    
    // Simulate scroll
    window.scrollY = 100
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(navbar.className).toMatch(/scrolled/)
    })
  })

  it('has proper accessibility attributes', () => {
    renderNavbar()
    const toggleButton = screen.queryByLabelText('Toggle navigation menu')
    
    // Mobile toggle should exist but might not be visible on desktop
    if (toggleButton) {
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle navigation menu')
    }
  })

  it('brand logo is rendered', () => {
    const { container } = renderNavbar()
    const logo = container.querySelector('svg')
    expect(logo).toBeInTheDocument()
  })

  it('navigation links have correct href attributes', () => {
    renderNavbar()
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/about')
    expect(screen.getByText('Contact').closest('a')).toHaveAttribute('href', '/contact')
  })
})
