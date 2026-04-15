/**
 * ForgotPasswordForm
 * Step 1: Enter email → request 6-digit reset code
 * Step 2: Enter code
 * Step 3: Enter + confirm new password → reset and auto-login
 */
import { useState } from 'react'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { API_URL } from '../injectables/Auth'

const ACCENT_GRAD     = 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)'
const ACCENT_GRAD_DIM = 'linear-gradient(135deg, rgba(220,46,115,0.5) 0%, rgba(251,64,64,0.5) 100%)'
const ACCENT_GLOW     = 'rgba(220,46,115,0.22)'

export default function ForgotPasswordForm({ onBack }) {
  const { resetPassword } = useAuth()
  const { closeModal } = useAuthModal()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}api/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send code.')
      }
      setStep(2)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setStep(3)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ email, code: code.trim(), newPassword, confirmPassword })
      closeModal()
    } catch (err) {
      setError(err?.error || err?.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  const eyeIcon = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="auth-pw-toggle"
      style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)',
        transition: 'color 0.15s', padding: 0, outline: 'none',
        touchAction: 'manipulation',
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
  )

  const submitBtn = (label, loadingLabel) => (
    <button
      type="submit"
      disabled={loading}
      className="auth-btn-primary"
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
      {loading ? loadingLabel : label}
    </button>
  )

  const backLink = (label, onClick) => (
    <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', margin: '2px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onClick}
        className="auth-btn-text"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FB4040', fontWeight: 600, fontSize: '12px', fontFamily: 'Sora, sans-serif', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 0 }}
      >
        {label}
      </button>
    </p>
  )

  const errorBlock = error && (
    <p style={{ fontSize: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(251,64,64,0.08)', border: '1px solid rgba(251,64,64,0.18)', color: '#fb6060', fontFamily: 'Sora, sans-serif', margin: 0 }}>
      {error}
    </p>
  )

  if (step === 1) return (
    <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        Enter your email and we'll send you a reset code.
      </p>
      {errorBlock}
      <input
        className="auth-input"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => { setError(null); setEmail(e.target.value) }}
        required
        autoComplete="email"
        aria-label="Email address"
      />
      {submitBtn('Send code', 'Sending…')}
      {backLink('Back to login', onBack)}
    </form>
  )

  if (step === 2) return (
    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        We sent a 6-digit code to <span style={{ color: 'rgba(255,255,255,0.65)' }}>{email}</span>.
      </p>
      {errorBlock}
      <input
        className="auth-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="6-digit code"
        value={code}
        onChange={(e) => { setError(null); setCode(e.target.value.replace(/\D/g, '')) }}
        required
        autoComplete="one-time-code"
        aria-label="Reset code"
      />
      {submitBtn('Verify code', 'Verifying…')}
      {backLink('Resend code', () => { setStep(1); setCode('') })}
    </form>
  )

  return (
    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        Choose a new password.
      </p>
      {errorBlock}
      <div style={{ position: 'relative' }}>
        <input
          className="auth-input"
          type={showPassword ? 'text' : 'password'}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => { setError(null); setNewPassword(e.target.value) }}
          required
          autoComplete="new-password"
          aria-label="New password"
          style={{ paddingRight: '2.75rem' }}
        />
        {eyeIcon}
      </div>
      <input
        className="auth-input"
        type={showPassword ? 'text' : 'password'}
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => { setError(null); setConfirmPassword(e.target.value) }}
        required
        autoComplete="new-password"
        aria-label="Confirm new password"
      />
      {submitBtn('Reset password', 'Resetting…')}
    </form>
  )
}
