/**
 * SignupForm
 * Step 1: Enter email → send verification code (or Continue with Google)
 * Step 2: Enter 6-digit code → verify
 * Step 3: Fill out the rest of the signup form
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaGoogle } from 'react-icons/fa'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth, API_URL } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import GoogleSetupStep from './GoogleSetupStep'

const ACCENT_GRAD     = 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)'
const ACCENT_GRAD_DIM = 'linear-gradient(135deg, rgba(220,46,115,0.5) 0%, rgba(251,64,64,0.5) 100%)'
const ACCENT_GLOW     = 'rgba(220,46,115,0.22)'

const GENDER_OPTIONS = [
  { value: 'MAN',               label: 'Male' },
  { value: 'WOMAN',             label: 'Female' },
  { value: 'NON-BINARY',        label: 'Non-binary' },
  { value: 'PREFER NOT TO SAY', label: 'Prefer not to say' },
]

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina",
  "Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados",
  "Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana",
  "Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros",
  "Congo (Congo-Brazzaville)","Costa Rica","Croatia","Cuba","Cyprus","Czechia",
  "Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua",
  "Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain",
  "Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan",
  "Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe",
]

function CountryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropPos, setDropPos] = useState({ left: 0, top: null, bottom: null, width: 0 })
  const wrapRef = useRef(null)
  const dropRef = useRef(null)
  const searchRef = useRef(null)

  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e) => {
      const inTrigger = wrapRef.current?.contains(e.target)
      const inDrop = dropRef.current?.contains(e.target)
      if (!inTrigger && !inDrop) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const handleOpen = () => {
    if (!open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      const dropdownHeight = 220 // approx: search bar + list
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight
      setDropPos({
        left: rect.left,
        width: rect.width,
        top: openUpward ? null : rect.bottom + 6,
        bottom: openUpward ? window.innerHeight - rect.top + 6 : null,
      })
    }
    setOpen(v => !v)
  }

  const handleSelect = (country) => {
    onChange(country)
    setOpen(false)
    setSearch('')
  }

  const dropdown = open && createPortal(
    <div ref={dropRef} style={{ position: 'fixed', top: dropPos.top ?? undefined, bottom: dropPos.bottom ?? undefined, left: dropPos.left, width: dropPos.width, background: '#141418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', zIndex: 99999, overflow: 'hidden', boxShadow: dropPos.bottom != null ? '0 -12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: '7px 7px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'relative' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.3, pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input ref={searchRef} type="text" placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px 6px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#f0f0f0', fontSize: '16px', fontFamily: 'Sora, sans-serif', outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ maxHeight: '160px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>No results</div>
        ) : (
          filtered.map(country => (
            <button key={country} type="button" onClick={() => handleSelect(country)}
              style={{ width: '100%', textAlign: 'left', padding: '11px 14px', fontSize: '13px', fontFamily: 'Sora, sans-serif', background: value === country ? 'rgba(251,64,64,0.12)' : 'transparent', color: value === country ? '#FB4040' : 'rgba(255,255,255,0.72)', border: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => { if (value !== country) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (value !== country) e.currentTarget.style.background = 'transparent' }}
            >{country}</button>
          ))
        )}
      </div>
    </div>,
    document.body
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={handleOpen}
        className="auth-input auth-input-compact"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <span style={{ color: value ? '#f0f0f0' : 'rgba(240,240,240,0.26)', fontSize: '13px' }}>
          {value || 'Country'}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ opacity: 0.35, flexShrink: 0, marginLeft: 6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </div>
  )
}

export default function SignupForm() {
  const { register, loginWithGoogle } = useAuth()
  const { closeModal, switchView } = useAuthModal()

  const [step, setStep] = useState('email')
  const [googleSuggestedUsername, setGoogleSuggestedUsername] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [form, setForm] = useState({ username: '', password: '', age: '', country: '', city: '', gender: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleChange = (e) => {
    setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError(null)
      try {
        const { created, suggestedUsername } = await loginWithGoogle(tokenResponse.access_token)
        if (created) {
          setGoogleSuggestedUsername(suggestedUsername || '')
          setStep('google-complete')
        } else {
          closeModal()
        }
      } catch (err) {
        setError(err?.error || 'Google sign up failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setError('Google sign up failed. Please try again.'),
  })

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}api/send-verification-code/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setStep('code')
      setResendTimer(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}api/verify-code/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid code')
      setStep('details')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ ...form, email })
      closeModal()
    } catch (err) {
      const firstField = Object.values(err ?? {})[0]
      const msg = Array.isArray(firstField) ? firstField[0] : firstField
      setError(typeof msg === 'string' ? msg : err?.detail ?? 'Registration failed. That username may already be taken.')
    } finally { setLoading(false) }
  }

  const submitBtn = (label, loadingLabel, disabled = false) => (
    <button type="submit" disabled={loading || disabled}
      className="auth-btn-primary"
      style={{ width: '100%', padding: '11px', marginTop: '2px', background: loading ? ACCENT_GRAD_DIM : ACCENT_GRAD, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13.5px', fontFamily: 'Sora, sans-serif', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}`, transition: 'box-shadow 0.2s ease', letterSpacing: '0.01em' }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 28px rgba(220,46,115,0.32)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}` }}
    >{loading ? loadingLabel : label}</button>
  )

  const errorBox = error && (
    <p style={{ fontSize: '12px', padding: '9px 13px', borderRadius: '10px', background: 'rgba(251,64,64,0.08)', border: '1px solid rgba(251,64,64,0.18)', color: '#fb6060', fontFamily: 'Sora, sans-serif', margin: 0 }}>
      {error}
    </p>
  )

  const loginSwitch = (
    <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', margin: '2px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      Already have an account?{' '}
      <button type="button" onClick={() => switchView('login')}
        className="auth-btn-text"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FB4040', fontWeight: 600, fontSize: '12px', fontFamily: 'Sora, sans-serif', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 0 }}>
        Log in
      </button>
    </p>
  )

  // ── Google new-user setup ──────────────────────────────────────────────────
  if (step === 'google-complete') return (
    <GoogleSetupStep suggestedUsername={googleSuggestedUsername} />
  )

  // ── Step 1: Email ──────────────────────────────────────────────────────────
  if (step === 'email') return (
    <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {/* Google button */}
      <button type="button" onClick={() => googleLogin()} disabled={googleLoading}
        className="auth-btn-primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'Sora, sans-serif', fontWeight: 500, cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? 0.6 : 1, transition: 'background 0.15s' }}
        onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        <FaGoogle style={{ fontSize: '12px', opacity: 0.65 }} />
        {googleLoading ? 'Signing up…' : 'Continue with Google'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontFamily: 'Sora, sans-serif' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {errorBox}
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif', textAlign: 'center', margin: 0 }}>Enter your email to get started</p>
      <input className="auth-input auth-input-compact" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      {submitBtn('Send verification code', 'Sending…', !email)}
      {loginSwitch}
    </form>
  )

  // ── Step 2: Verify code ────────────────────────────────────────────────────
  if (step === 'code') return (
    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {errorBox}
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Sora, sans-serif', textAlign: 'center', margin: 0 }}>
        We sent a 6-digit code to<br />
        <span style={{ color: '#FB4040', fontWeight: 600 }}>{email}</span>
      </p>
      <input className="auth-input auth-input-compact"
        style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '0.3em', fontWeight: 700 }}
        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="000000" value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6} required autoComplete="one-time-code"
      />
      {submitBtn('Verify code', 'Verifying…', code.length !== 6)}
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', margin: 0 }}>
        Didn't get it?{' '}
        {resendTimer > 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.22)' }}>Resend in {resendTimer}s</span>
        ) : (
          <button type="button"
            onClick={async () => {
              setError(null)
              setResendTimer(60)
              try {
                const res = await fetch(`${API_URL}api/send-verification-code/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
                if (!res.ok) { setResendTimer(0); setError('Failed to resend code. Please try again.') }
              } catch { setResendTimer(0); setError('Failed to resend code. Please try again.') }
            }}
            className="auth-btn-text"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FB4040', fontWeight: 600, fontSize: '12px', fontFamily: 'Sora, sans-serif', textDecoration: 'underline', padding: 0 }}
          >Resend code</button>
        )}
      </p>
      <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null) }}
        className="auth-btn-text"
        style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontFamily: 'Sora, sans-serif', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center' }}>
        ← Change email
      </button>
    </form>
  )

  // ── Step 3: Details ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {errorBox}
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif', textAlign: 'center', margin: 0 }}>
        ✓ Email verified — finish setting up your account
      </p>
      <input className="auth-input auth-input-compact" type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required autoComplete="username" />
      <div style={{ position: 'relative' }}>
        <input className="auth-input auth-input-compact" type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="new-password" style={{ paddingRight: '2.75rem' }} />
        <button type="button" onClick={() => setShowPassword(v => !v)}
          className="auth-pw-toggle"
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', color: showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)', padding: 0, outline: 'none', touchAction: 'manipulation' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)' }}
        >
          {showPassword ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', marginBottom: '1px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: '8.5px', fontFamily: 'Sora, sans-serif', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>About you</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input className="auth-input auth-input-compact" style={{ flex: 1 }} type="number" name="age" placeholder="Age" min="13" max="120" value={form.age} onChange={handleChange} />
        <select className="auth-input auth-input-compact" style={{ flex: 1, appearance: 'none', cursor: 'pointer', color: form.gender ? '#f0f0f0' : 'rgba(240,240,240,0.26)' }} name="gender" value={form.gender} onChange={handleChange}>
          <option value="" style={{ background: '#141418' }}>Gender</option>
          {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#141418' }}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input className="auth-input auth-input-compact" style={{ flex: 1 }} type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} />
        <CountryDropdown value={form.country} onChange={(country) => setForm(prev => ({ ...prev, country }))} />
      </div>
      {submitBtn('Create account', 'Creating account…')}
      {loginSwitch}
    </form>
  )
}