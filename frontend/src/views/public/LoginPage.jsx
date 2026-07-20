import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../../services/authService'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login(email, password)
      const role = data.user?.role?.name
      localStorage.setItem('user', JSON.stringify(data.user))
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'reviewer') navigate('/reviewer/dashboard')
      else if (role === 'author') navigate('/author/dashboard')
      else navigate('/')
    } catch (err) {
      setError(err.detail || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-layout" style={{ minHeight: '100vh', display: 'grid', background: '#f0f4f8' }}>
      {/* Left - Branding */}
      <div className="auth-branding-side" style={{ background: 'linear-gradient(135deg, #0a2240 0%, #1a5490 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(212,175,55,0.1) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, color: 'white' }}>
          <div style={{ marginBottom: '2rem', background: 'white', borderRadius: 12, padding: '8px 16px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
            <img src="/spsu-logo.png" alt="SPSU" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem', color: 'white' }}>The Essence</h1>
          <div style={{ width: 50, height: 3, background: '#d4af37', marginBottom: '1.5rem', borderRadius: 2 }}></div>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#ffffff', marginBottom: '2rem' }}>
            SPSU's peer-reviewed academic journal — advancing research across engineering, science, management, and humanities.
          </p>
          <div style={{ fontSize: '0.8rem', letterSpacing: 2, color: '#e8c94e', textTransform: 'uppercase', fontWeight: 500 }}>
            Sir Padampat Singhania University
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 550, background: 'white', padding: '2.5rem', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0a2240', marginBottom: '0.25rem' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>Sign in to your account</p>

          {reason === 'timeout' && (
            <div style={{ padding: '0.75rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#92400E' }}>
              Session expired. Please log in again.
            </div>
          )}
          {reason === 'session_expired' && (
            <div style={{ padding: '0.75rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B' }}>
              Your session has expired. Please log in again.
            </div>
          )}
          {error && (
            <div style={{ padding: '0.75rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                style={{ width: '100%', padding: '0.7rem 0.875rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#1a5490'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password"
                  style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 0.875rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#1a5490'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.8rem', background: loading ? '#9CA3AF' : '#1a5490', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
              Don't have an account? <Link to="/signup" style={{ color: '#1a5490', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`.auth-page-layout { grid-template-columns: 1fr 1fr; } @media (max-width: 900px) { .auth-page-layout { grid-template-columns: 1fr; } .auth-branding-side { display: none !important; } }`}</style>
    </div>
  )
}

export default LoginPage
