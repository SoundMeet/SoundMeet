/**
 * SignupForm
 * Compact layout — fits in modal without scrolling.
 * Country dropdown opens upward so it never pushes content off screen.
 */
import { useState, useRef, useEffect } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'

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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )

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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="jam-input w-full flex items-center justify-between"
        style={{ cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ color: value ? 'inherit' : 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
          {value || 'Country'}
        </span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{
            opacity: 0.4, flexShrink: 0, marginLeft: 6,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — opens UPWARD so it doesn't push the page */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',  // upward
            left: 0, right: 0,
            background: '#1a1a1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            zIndex: 9999,
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Search */}
          <div style={{ padding: '7px 7px 4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ position: 'relative' }}>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '6px 10px 6px 28px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', color: '#fff', fontSize: '12px',
                  fontFamily: 'Sora, sans-serif', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '160px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Sora, sans-serif' }}>
                No results
              </div>
            ) : (
              filtered.map(country => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 14px', fontSize: '12px',
                    fontFamily: 'Sora, sans-serif',
                    background: value === country ? 'rgba(220,46,115,0.15)' : 'transparent',
                    color: value === country ? '#DC2E73' : 'rgba(255,255,255,0.75)',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (value !== country) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (value !== country) e.currentTarget.style.background = 'transparent' }}
                >
                  {country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignupForm() {
  const { register } = useAuth()
  const { closeModal, switchView } = useAuthModal()

  const [form, setForm] = useState({
    username: '', email: '', password: '',
    age: '', country: '', city: '', gender: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(form)
      closeModal()
    } catch (err) {
      const firstField = Object.values(err ?? {})[0]
      const msg = Array.isArray(firstField) ? firstField[0] : firstField
      setError(
        typeof msg === 'string'
          ? msg
          : err?.detail ?? 'Registration failed. That username may already be taken.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Compact shared input style — smaller padding so everything fits
  const compactInput = {
    padding: '8px 12px',
    fontSize: '13px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Google placeholder */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 rounded-xl font-medium transition-colors duration-150 hover:bg-white/[0.09] focus:outline-none"
        style={{
          padding: '8px',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.72)',
          fontFamily: 'Sora, sans-serif',
          fontSize: '13px',
        }}
      >
        <FaGoogle className="text-sm opacity-70" />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>or</span>
        <div className="flex-1" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '11px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(251,64,64,0.1)', color: '#fb4040', fontFamily: 'Sora, sans-serif' }}>
          {error}
        </p>
      )}

      {/* Required fields */}
      <input className="jam-input" style={compactInput} type="text"     name="username" placeholder="Username" value={form.username} onChange={handleChange} required autoComplete="username" />
      <input className="jam-input" style={compactInput} type="email"    name="email"    placeholder="Email"    value={form.email}    onChange={handleChange} required autoComplete="email" />
      <input className="jam-input" style={compactInput} type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="new-password" />

      {/* Age + Gender */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          className="jam-input" style={{ ...compactInput, flex: 1 }}
          type="number" name="age" placeholder="Age" min="13" max="120"
          value={form.age} onChange={handleChange}
        />
        <select
          className="jam-input" style={{ ...compactInput, flex: 1, appearance: 'none', cursor: 'pointer' }}
          name="gender" value={form.gender} onChange={handleChange}
        >
          <option value="" style={{ background: '#121212' }}>Gender</option>
          {GENDER_OPTIONS.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#121212' }}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* City + Country */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          className="jam-input" style={{ ...compactInput, flex: 1 }}
          type="text" name="city" placeholder="City"
          value={form.city} onChange={handleChange}
        />
        <CountryDropdown
          value={form.country}
          onChange={(country) => setForm(prev => ({ ...prev, country }))}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl font-semibold transition-all duration-200 focus:outline-none"
        style={{
          padding: '9px',
          background: loading ? 'rgba(220,46,115,0.5)' : '#DC2E73',
          color: '#fff', fontSize: '13px',
          fontFamily: 'Sora, sans-serif',
          opacity: loading ? 0.75 : 1,
          boxShadow: loading ? 'none' : '0 0 20px rgba(220,46,115,0.25)',
          marginTop: '2px',
        }}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      {/* Switch to login */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => switchView('login')}
          style={{ color: '#DC2E73', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'Sora, sans-serif' }}
        >
          Log in
        </button>
      </p>

    </form>
  )
}