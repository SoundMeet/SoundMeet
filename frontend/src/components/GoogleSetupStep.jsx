/**
 * GoogleSetupStep
 * Shown after Google OAuth for new users.
 * Collects: username (required), password (optional), age, gender, city, country.
 */
import { useState, useRef, useEffect } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { apiFetch, useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'

const ACCENT_GRAD     = 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)'
const ACCENT_GRAD_DIM = 'linear-gradient(135deg, rgba(220,46,115,0.5) 0%, rgba(251,64,64,0.5) 100%)'
const ACCENT_GLOW     = 'rgba(220,46,115,0.22)'

const GENDER_OPTIONS = [
  { value: 'MAN',               label: 'Man' },
  { value: 'WOMAN',             label: 'Woman' },
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
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef             = useRef(null)
  const searchRef           = useRef(null)

  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const handleSelect = (country) => {
    onChange(country)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
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

      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, background: '#141418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', zIndex: 9999, overflow: 'hidden', boxShadow: '0 -12px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ padding: '7px 7px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.3, pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={searchRef} type="text" placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#f0f0f0', fontSize: '12px', fontFamily: 'Sora, sans-serif', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>No results</div>
            ) : (
              filtered.map(country => (
                <button key={country} type="button" onClick={() => handleSelect(country)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '12px', fontFamily: 'Sora, sans-serif', background: value === country ? 'rgba(251,64,64,0.12)' : 'transparent', color: value === country ? '#FB4040' : 'rgba(255,255,255,0.72)', border: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (value !== country) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (value !== country) e.currentTarget.style.background = 'transparent' }}
                >{country}</button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GoogleSetupStep({ suggestedUsername }) {
  const { closeModal } = useAuthModal()
  const { fetchProfile } = useAuth()

  const [username,     setUsername]     = useState(suggestedUsername || '')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [skipPassword, setSkipPassword] = useState(false)
  const [age,          setAge]          = useState('')
  const [gender,       setGender]       = useState('')
  const [city,         setCity]         = useState('')
  const [country,      setCountry]      = useState('')
  const [error,        setError]        = useState(null)
  const [loading,      setLoading]      = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiFetch('api/auth/finalize-google/', {
        method: 'POST',
        body: JSON.stringify({
          username,
          ...(!skipPassword && password ? { password } : {}),
          ...(age     ? { age }     : {}),
          ...(gender  ? { gender }  : {}),
          ...(city    ? { city }    : {}),
          ...(country ? { country } : {}),
        }),
      })
      await fetchProfile()
      closeModal()
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>

      {/* Google connected badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '2px' }}>
        <FaGoogle style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Sora, sans-serif' }}>
          Google connected — finish setting up your account
        </span>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '12px', padding: '9px 13px', borderRadius: '10px', background: 'rgba(251,64,64,0.08)', border: '1px solid rgba(251,64,64,0.18)', color: '#fb6060', fontFamily: 'Sora, sans-serif', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Username */}
      <input
        className="auth-input auth-input-compact"
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        autoComplete="username"
        autoFocus
      />

      {/* Password */}
      {!skipPassword ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ position: 'relative' }}>
            <input
              className="auth-input auth-input-compact"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (optional)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)', padding: 0, outline: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)' }}
              onMouseLeave={e => { e.currentTarget.style.color = showPassword ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)' }}
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
          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => { setSkipPassword(true); setPassword('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>No password — Google login only</span>
          <button
            type="button"
            onClick={() => setSkipPassword(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#FB4040', fontFamily: 'Sora, sans-serif', padding: 0, fontWeight: 600 }}
          >
            Add one
          </button>
        </div>
      )}

      {/* About you divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', marginBottom: '1px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: '8.5px', fontFamily: 'Sora, sans-serif', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>About you</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Age + Gender */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          className="auth-input auth-input-compact"
          style={{ flex: 1 }}
          type="number"
          placeholder="Age"
          min="13" max="120"
          value={age}
          onChange={e => setAge(e.target.value)}
        />
        <select
          className="auth-input auth-input-compact"
          style={{ flex: 1, appearance: 'none', cursor: 'pointer', color: gender ? '#f0f0f0' : 'rgba(240,240,240,0.26)' }}
          value={gender}
          onChange={e => setGender(e.target.value)}
        >
          <option value="" style={{ background: '#141418' }}>Gender</option>
          {GENDER_OPTIONS.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#141418' }}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* City + Country */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          className="auth-input auth-input-compact"
          style={{ flex: 1 }}
          type="text"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        <CountryDropdown value={country} onChange={setCountry} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !username.trim()}
        style={{ width: '100%', padding: '11px', marginTop: '2px', background: loading || !username.trim() ? ACCENT_GRAD_DIM : ACCENT_GRAD, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13.5px', fontFamily: 'Sora, sans-serif', fontWeight: 600, cursor: loading || !username.trim() ? 'not-allowed' : 'pointer', opacity: loading || !username.trim() ? 0.6 : 1, boxShadow: loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}`, transition: 'box-shadow 0.2s ease', letterSpacing: '0.01em' }}
        onMouseEnter={e => { if (!loading && username.trim()) e.currentTarget.style.boxShadow = '0 4px 28px rgba(220,46,115,0.32)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? 'none' : `0 4px 22px ${ACCENT_GLOW}` }}
      >
        {loading ? 'Finishing setup…' : 'Finish setup →'}
      </button>

    </form>
  )
}
