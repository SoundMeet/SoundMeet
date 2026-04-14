/**
 * LoginForm
 * - Username/password login
 * - Google OAuth login
 */
import { useState } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import GoogleSetupStep from './GoogleSetupStep'

const ACCENT_GRAD     = 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)'
const ACCENT_GRAD_DIM = 'linear-gradient(135deg, rgba(220,46,115,0.5) 0%, rgba(251,64,64,0.5) 100%)'
const ACCENT_GLOW     = 'rgba(220,46,115,0.22)'

export default function LoginForm() {
  const { login, loginWithGoogle } = useAuth()
  const { closeModal, switchView } = useAuthModal()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleSetup, setGoogleSetup] = useState(null) // { suggestedUsername } when new Google user

  const handleChange = (e) => {
    setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form)
      closeModal()
    } catch (err) {
      setError(
        err?.non_field_errors?.[0] ??
          err?.detail ??
          'Invalid username or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError(null)
      try {
        const { created, suggestedUsername } = await loginWithGoogle(tokenResponse.access_token)
        if (created) {
          setGoogleSetup({ suggestedUsername: suggestedUsername || '' })
        } else {
          closeModal()
        }
      } catch (err) {
        setError(err?.error || 'Google login failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setError('Google login failed. Please try again.'),
  })

  if (googleSetup) return (
    <GoogleSetupStep suggestedUsername={googleSetup.suggestedUsername} />
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Google button */}
      <button
        type="button"
        onClick={() => googleLogin()}
        disabled={googleLoading}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', padding: '11px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '13.5px', fontFamily: 'Sora, sans-serif', fontWeight: 500,
          cursor: googleLoading ? 'not-allowed' : 'pointer',
          opacity: googleLoading ? 0.6 : 1,
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!googleLoading) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        }}
      >
        <FaGoogle style={{ fontSize: '13px', opacity: 0.65 }} />
        {googleLoading ? 'Signing in…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.24)', fontFamily: 'Sora, sans-serif', letterSpacing: '0.04em' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(251,64,64,0.08)', border: '1px solid rgba(251,64,64,0.18)', color: '#fb6060', fontFamily: 'Sora, sans-serif', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Username */}
      <input
        className="auth-input"
        type="text" name="username" placeholder="Username"
        value={form.username} onChange={handleChange}
        required autoComplete="username" aria-label="Username"
      />

      {/* Password */}
      <div style={{ position: 'relative' }}>
        <input
          className="auth-input"
          type={showPassword ? 'text' : 'password'}
          name="password" placeholder="Password"
          value={form.password} onChange={handleChange}
          required autoComplete="current-password" aria-label="Password"
          style={{ paddingRight: '2.75rem' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)',
            transition: 'color 0.15s', padding: 0, outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)' }}
        >
          {showPassword ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '12px', marginTop: '2px',
          background: loading ? ACCENT_GRAD_DIM : ACCENT_GRAD,
          border: 'none', borderRadius: '12px',
          color: '#fff', fontSize: '14px',
          fontFamily: 'Sora, sans-serif', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}`,
          transition: 'box-shadow 0.2s ease',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 28px rgba(220,46,115,0.32)' }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}` }}
      >
        {loading ? 'Signing in…' : 'Log in'}
      </button>

      {/* Switch to sign up */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', margin: '2px 0 0' }}>
        No account?{' '}
        <button
          type="button"
          onClick={() => switchView('signup')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FB4040', fontWeight: 600, fontSize: '12px', fontFamily: 'Sora, sans-serif', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 0 }}
        >
          Sign up
        </button>
      </p>
    </form>
  )
}