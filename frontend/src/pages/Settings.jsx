import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { FaBell, FaLink, FaLock, FaMusic, FaPalette, FaUser } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { DeleteAccountSheet } from '../components/ui/DeleteAccountSheet'
import { ChangePasswordSheet } from '../components/ui/ChangePasswordSheet'
import { formatAvatarUrl } from '../utils/formatAvatarUrl'

// ─── Shared sheet wrapper ─────────────────────────────────────────────────────
// NOTE: must NOT have an early return before AnimatePresence so exit anims fire.
function Sheet({ open, onClose, title, icon, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="sheet-panel"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 pointer-events-auto"
              style={{
                boxShadow: '0 0 60px rgba(0,0,0,0.92), 0 0 24px rgba(220,46,115,0.06)',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle — mobile only */}
              <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />

              {/* Icon + title */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(220,46,115,0.10)', border: '1px solid rgba(220,46,115,0.18)' }}
              >
                {icon}
              </div>
              <h2 className="text-[1.05rem] font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                {title}
              </h2>

              {children}

              {footer && <div className="mt-5">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Shared save/cancel footer ────────────────────────────────────────────────
function SheetActions({ onCancel, onSave, saveLabel = 'Save', disabled, loading }) {
  return (
    <div className="flex gap-2.5">
      <button
        onClick={onCancel}
        disabled={loading}
        className="flex-1 h-10 rounded-full text-sm font-semibold transition-all duration-150 disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.6)', fontFamily: 'Sora, sans-serif' }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled || loading}
        className="flex-1 h-10 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: 'rgba(220,46,115,0.14)', color: 'rgba(220,46,115,0.9)', border: '1px solid rgba(220,46,115,0.22)', fontFamily: 'Sora, sans-serif' }}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-pink-400/50 border-t-pink-400 animate-spin" />
            Saving…
          </>
        ) : saveLabel}
      </button>
    </div>
  )
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors disabled:opacity-40'
const inputStyle = { fontFamily: 'Sora, sans-serif' }

// ─── Toast ────────────────────────────────────────────────────────────────────
function SettingsToast({ toast }) {
  if (!toast) return null
  const isErr = toast.type === 'error'
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium pointer-events-none"
      style={{
        background: 'rgba(18,18,18,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: isErr ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(220,46,115,0.30)',
        color: 'rgba(229,226,225,0.9)',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span style={{ color: isErr ? '#ef4444' : '#DC2E73', fontWeight: 700 }}>{isErr ? '✕' : '✓'}</span>
      {toast.message}
    </div>
  )
}

// ─── Display name sheet ───────────────────────────────────────────────────────
function DisplayNameSheet({ open, onClose, current, onSave }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setValue(current ?? ''); setError('') }
  }, [open, current])

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed) { setError('Display name cannot be empty.'); return }
    setLoading(true)
    try {
      await onSave({ display_name: trimmed })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Display name"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} disabled={!value.trim()} loading={loading} />}
    >
      <input
        className={inputCls}
        style={inputStyle}
        type="text"
        placeholder="Your display name"
        value={value}
        maxLength={40}
        onChange={e => { setValue(e.target.value); setError('') }}
        disabled={loading}
        autoFocus
      />
      <p className="text-xs mt-1.5 ml-0.5" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>
        This is how other musicians will see you.
      </p>
      {error && <p className="text-xs mt-2" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
    </Sheet>
  )
}

// ─── Headline sheet ───────────────────────────────────────────────────────────
function HeadlineSheet({ open, onClose, current, onSave }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setValue(current ?? ''); setError('') }
  }, [open, current])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ headline: value.trim() })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Headline"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} loading={loading} />}
    >
      <input
        className={inputCls}
        style={inputStyle}
        type="text"
        placeholder="e.g. Jazz guitarist based in Austin"
        value={value}
        maxLength={100}
        onChange={e => { setValue(e.target.value); setError('') }}
        disabled={loading}
        autoFocus
      />
      <p className="text-xs mt-1.5 ml-0.5" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>
        A short tagline shown on your profile.
      </p>
      {error && <p className="text-xs mt-2" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
    </Sheet>
  )
}

// ─── Bio sheet ────────────────────────────────────────────────────────────────
function BioSheet({ open, onClose, current, onSave }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setValue(current ?? ''); setError('') }
  }, [open, current])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ about: value.trim() })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Bio"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} loading={loading} />}
    >
      <textarea
        className={inputCls + ' resize-none'}
        style={{ ...inputStyle, height: 120 }}
        placeholder="Tell the world about your musical journey…"
        value={value}
        maxLength={500}
        onChange={e => { setValue(e.target.value); setError('') }}
        disabled={loading}
        autoFocus
      />
      <p className="text-xs mt-1.5 ml-0.5" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>
        {value.length}/500
      </p>
      {error && <p className="text-xs mt-2" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
    </Sheet>
  )
}

// ─── Skill level sheet ────────────────────────────────────────────────────────
const SKILL_LEVELS = [
  { value: 'beginner',     bars: 1, name: 'Beginner',     desc: 'Just starting out'      },
  { value: 'intermediate', bars: 2, name: 'Intermediate', desc: 'Know my way around'     },
  { value: 'advanced',     bars: 3, name: 'Advanced',     desc: 'Highly experienced'     },
  { value: 'professional', bars: 4, name: 'Professional', desc: 'I do this for a living' },
]

function SkillBars({ count, active }) {
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {[1, 2, 3, 4].map(n => (
        <div
          key={n}
          className="w-1 rounded-sm transition-colors duration-150"
          style={{
            height: `${(n / 4) * 100}%`,
            background: n <= count
              ? (active ? '#DC2E73' : 'rgba(220,46,115,0.40)')
              : 'rgba(255,255,255,0.10)',
          }}
        />
      ))}
    </div>
  )
}

function SkillLevelSheet({ open, onClose, current, onSave }) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setSelected(current ?? ''); setError('') }
  }, [open, current])

  const handleSave = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await onSave({ skill_level: selected })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Skill level"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} disabled={!selected} loading={loading} />}
    >
      <div className="grid grid-cols-2 gap-2">
        {SKILL_LEVELS.map(s => {
          const isActive = selected === s.value
          return (
            <button
              key={s.value}
              onClick={() => { setSelected(s.value); setError('') }}
              disabled={loading}
              className="flex flex-col items-start gap-2 p-3 rounded-xl border transition-all duration-150"
              style={{
                background: isActive ? 'rgba(220,46,115,0.10)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(220,46,115,0.30)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <SkillBars count={s.bars} active={isActive} />
              <div>
                <p className="text-sm font-semibold text-left" style={{ color: isActive ? '#DC2E73' : 'rgba(255,255,255,0.80)', fontFamily: 'Sora, sans-serif' }}>
                  {s.name}
                </p>
                <p className="text-[11px] mt-0.5 text-left" style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'Sora, sans-serif' }}>
                  {s.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs mt-3" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
    </Sheet>
  )
}

// ─── Profile photo sheet ──────────────────────────────────────────────────────
function ProfilePhotoSheet({ open, onClose, currentUrl, onSave }) {
  const inputRef = useRef(null)
  const prevPreview = useRef(null)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Clean up preview when sheet closes
  useEffect(() => {
    if (!open) {
      if (prevPreview.current) { URL.revokeObjectURL(prevPreview.current); prevPreview.current = null }
      setPreview(null)
      setFile(null)
      setError('')
    }
  }, [open])

  const handleFile = (f) => {
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB.'); return }
    if (prevPreview.current) URL.revokeObjectURL(prevPreview.current)
    const url = URL.createObjectURL(f)
    prevPreview.current = url
    setPreview(url)
    setFile(f)
    setError('')
  }

  const handleSave = async () => {
    if (!file) return
    setLoading(true)
    try {
      await onSave({ pfp: file })
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayUrl = preview ?? currentUrl

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Profile photo"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} disabled={!file} loading={loading} saveLabel="Update photo" />}
    >
      <div className="flex flex-col items-center gap-4 mb-4">
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(220,46,115,0.25)' }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="h-9 px-5 rounded-full text-sm font-semibold transition-all duration-150 disabled:opacity-40"
          style={{ background: 'rgba(220,46,115,0.12)', color: '#DC2E73', border: '1px solid rgba(220,46,115,0.22)', fontFamily: 'Sora, sans-serif' }}
        >
          {file ? 'Change photo' : 'Choose photo'}
        </button>
      </div>
      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>
        JPG, PNG or WebP · Max 10 MB
      </p>
      {error && <p className="text-xs mt-2 text-center" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }}
      />
    </Sheet>
  )
}

// ─── Social links sheet ───────────────────────────────────────────────────────
const LINK_PLATFORMS = [
  { key: 'spotify',    label: 'Spotify',    placeholder: 'https://open.spotify.com/artist/…' },
  { key: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/yourname'   },
  { key: 'bandcamp',   label: 'Bandcamp',   placeholder: 'https://yourname.bandcamp.com'     },
  { key: 'youtube',    label: 'YouTube',    placeholder: 'https://youtube.com/@yourchannel'  },
  { key: 'instagram',  label: 'Instagram',  placeholder: 'https://instagram.com/yourname'   },
  { key: 'tiktok',     label: 'TikTok',     placeholder: 'https://tiktok.com/@yourname'     },
]

function SocialLinksSheet({ open, onClose, current, onSave }) {
  const EMPTY = { spotify: '', soundcloud: '', bandcamp: '', youtube: '', instagram: '', tiktok: '' }
  const [values, setValues] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValues({
        spotify:    current?.spotify    ?? '',
        soundcloud: current?.soundcloud ?? '',
        bandcamp:   current?.bandcamp   ?? '',
        youtube:    current?.youtube    ?? '',
        instagram:  current?.instagram  ?? '',
        tiktok:     current?.tiktok     ?? '',
      })
      setError('')
    }
  }, [open]) // intentionally only on open change; current is stable

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(values)
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => { if (!loading) onClose() }}
      title="Music & social links"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
      footer={<SheetActions onCancel={() => { if (!loading) onClose() }} onSave={handleSave} loading={loading} saveLabel="Save links" />}
    >
      <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-0.5">
        {LINK_PLATFORMS.map(p => (
          <div key={p.key}>
            <label
              className="text-[10px] font-semibold uppercase tracking-wider mb-1 block"
              style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'Sora, sans-serif' }}
            >
              {p.label}
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              type="url"
              placeholder={p.placeholder}
              value={values[p.key]}
              onChange={e => { setValues(v => ({ ...v, [p.key]: e.target.value })); setError('') }}
              disabled={loading}
            />
          </div>
        ))}
      </div>
      {error && <p className="text-xs mt-3" style={{ color: 'rgba(239,68,68,0.85)', fontFamily: 'Sora, sans-serif' }}>{error}</p>}
    </Sheet>
  )
}

// ─── Available-to-jam toggle row ──────────────────────────────────────────────
function AvailableToJamRow({ value, onChange, loading }) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={loading}
      className="flex items-center justify-between px-4 py-3 rounded-xl w-full text-left transition-colors duration-150 hover:bg-white/[0.04] disabled:opacity-50"
    >
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-sm text-white/70 block" style={{ fontFamily: 'Sora, sans-serif' }}>
          Available to jam
        </span>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>
          {value ? 'Visible as available on discover' : 'Hidden from availability search'}
        </span>
      </div>
      {/* Toggle pill */}
      <div
        className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
        style={{ background: value ? 'rgba(220,46,115,0.85)' : 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
          style={{ left: value ? 'calc(100% - 20px)' : '4px' }}
        />
      </div>
    </button>
  )
}

// ─── Setting row ──────────────────────────────────────────────────────────────
function SettingRow({ label, value, onClick, comingSoon }) {
  if (comingSoon) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl">
        <span className="text-sm text-white/70" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</span>
        <span
          className="text-xs px-3 py-1 rounded-full shrink-0 ml-2"
          style={{ background: 'rgba(220,46,115,0.12)', color: '#DC2E73', fontFamily: 'Sora, sans-serif' }}
        >
          Coming soon
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150 w-full text-left hover:bg-white/[0.04] active:bg-white/[0.06]"
    >
      <span className="text-sm text-white/70 shrink-0" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</span>
      <div className="flex items-center gap-2 min-w-0 ml-2">
        {value && (
          <span
            className="text-xs truncate max-w-[140px]"
            style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'Sora, sans-serif' }}
          >
            {value}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  )
}

// ─── Section group wrapper ────────────────────────────────────────────────────
function SettingGroup({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#1A1A1A' }}>
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06]">
        <Icon className="text-sm shrink-0" style={{ color: '#DC2E73' }} />
        <span
          className="text-xs font-semibold uppercase tracking-widest text-white/40"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.68rem' }}
        >
          {label}
        </span>
      </div>
      <div className="px-1 py-1">{children}</div>
    </div>
  )
}

// ─── Change password row ──────────────────────────────────────────────────────
function ChangePasswordRow({ user }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { changePassword } = useAuth()
  const hasUsablePassword = user?.has_usable_password ?? true

  const handleConfirm = async (currentPassword, newPassword, confirmNewPassword) => {
    setError('')
    setLoading(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword })
      setOpen(false)
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingRow
        label={hasUsablePassword ? 'Change password' : 'Set a password'}
        onClick={() => { setError(''); setOpen(true) }}
      />
      <ChangePasswordSheet
        open={open}
        onClose={() => { if (!loading) setOpen(false) }}
        onConfirm={handleConfirm}
        loading={loading}
        hasUsablePassword={hasUsablePassword}
        error={error}
        onClearError={() => setError('')}
      />
    </>
  )
}

// ─── Danger zone ──────────────────────────────────────────────────────────────
function DangerZoneSection({ user }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmUsername, setConfirmUsername] = useState('')
  const [error, setError] = useState('')
  const { deleteAccount, isLoggedIn } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()

  if (!isLoggedIn) return null

  const isGoogleUser = user && !user.has_usable_password

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      await deleteAccount({
        password: isGoogleUser ? undefined : password,
        confirmUsername: isGoogleUser ? confirmUsername : undefined,
      })
      openModal('login')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: '#1A1A1A', border: '1px solid rgba(251,64,64,0.10)' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(251,64,64,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(251,64,64,0.55)', fontFamily: 'Sora, sans-serif', fontSize: '0.68rem' }}
          >
            Danger Zone
          </span>
        </div>
        <div className="px-1 py-1">
          <button
            onClick={() => { setError(''); setPassword(''); setConfirmUsername(''); setOpen(true) }}
            className="flex items-center justify-between px-4 py-3 rounded-xl w-full text-left transition-colors duration-150 hover:bg-white/[0.04]"
          >
            <span className="text-sm font-medium" style={{ color: 'rgba(251,64,64,0.8)', fontFamily: 'Sora, sans-serif' }}>
              Delete account
            </span>
            <span className="text-xs" style={{ color: 'rgba(251,64,64,0.35)', fontFamily: 'Sora, sans-serif' }}>
              Permanent
            </span>
          </button>
        </div>
      </div>

      <DeleteAccountSheet
        open={open}
        onClose={() => { if (!loading) setOpen(false) }}
        onConfirm={handleConfirm}
        loading={loading}
        isGoogleUser={isGoogleUser}
        username={user?.username}
        password={password}
        setPassword={val => { setPassword(val); setError('') }}
        confirmUsername={confirmUsername}
        setConfirmUsername={val => { setConfirmUsername(val); setError('') }}
        error={error}
      />
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateProfile } = useAuth()
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [displayNameOpen, setDisplayNameOpen] = useState(false)
  const [photoOpen,       setPhotoOpen]       = useState(false)
  const [headlineOpen,    setHeadlineOpen]    = useState(false)
  const [bioOpen,         setBioOpen]         = useState(false)
  const [skillOpen,       setSkillOpen]       = useState(false)
  const [linksOpen,       setLinksOpen]       = useState(false)
  const [jamLoading,      setJamLoading]      = useState(false)

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const handleSave = async (data, label) => {
    await updateProfile(data)
    showToast(`${label} updated.`)
  }

  const handleJamToggle = async (val) => {
    setJamLoading(true)
    try {
      await updateProfile({ available_to_jam: val })
      showToast(val ? "You're now available to jam." : 'Availability hidden.')
    } catch {
      showToast('Failed to update. Please try again.', 'error')
    } finally {
      setJamLoading(false)
    }
  }

  const avatarUrl = formatAvatarUrl(user?.pfp)
  const skillLabel = SKILL_LEVELS.find(s => s.value === user?.skill_level)?.name ?? null
  const hasAnyLink = ['spotify', 'soundcloud', 'bandcamp', 'youtube', 'instagram', 'tiktok'].some(k => user?.[k])

  return (
    <div className="min-h-screen px-4 pt-10 pb-28 flex flex-col items-center">
      <Helmet>
        <title>Settings</title>
        <meta name="description" content="Manage your SoundMeet account settings — profile, music identity, privacy, notifications, and appearance." />
      </Helmet>
      <div className="w-full max-w-lg">

        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          Settings
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif' }}>
          Manage your account and profile preferences.
        </p>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <SettingGroup icon={FaUser} label="Account">
          <SettingRow
            label="Display name"
            value={user?.display_name || null}
            onClick={() => setDisplayNameOpen(true)}
          />
          <div className="flex items-center justify-between px-4 py-3 rounded-xl">
            <span className="text-sm text-white/70" style={{ fontFamily: 'Sora, sans-serif' }}>Username</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'Sora, sans-serif' }}>
              {user?.username ? `@${user.username}` : '—'}
            </span>
          </div>
          <SettingRow label="Email address" comingSoon />
          {/* Profile photo — custom row with avatar thumbnail */}
          <button
            onClick={() => setPhotoOpen(true)}
            className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150 w-full text-left hover:bg-white/[0.04] active:bg-white/[0.06]"
          >
            <span className="text-sm text-white/70 shrink-0" style={{ fontFamily: 'Sora, sans-serif' }}>
              Profile photo
            </span>
            <div className="flex items-center gap-2 ml-2">
              <div
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        </SettingGroup>

        {/* ── Music Identity ─────────────────────────────────────────────────── */}
        <SettingGroup icon={FaMusic} label="Music Identity">
          <SettingRow
            label="Headline"
            value={user?.headline || null}
            onClick={() => setHeadlineOpen(true)}
          />
          <SettingRow
            label="Bio"
            value={user?.about ? `${user.about.slice(0, 32)}${user.about.length > 32 ? '…' : ''}` : null}
            onClick={() => setBioOpen(true)}
          />
          <SettingRow
            label="Skill level"
            value={skillLabel}
            onClick={() => setSkillOpen(true)}
          />
        </SettingGroup>

        {/* ── Music & Social Links ───────────────────────────────────────────── */}
        <SettingGroup icon={FaLink} label="Music & Social Links">
          <SettingRow
            label="Manage links"
            value={hasAnyLink ? 'Linked' : null}
            onClick={() => setLinksOpen(true)}
          />
        </SettingGroup>

        {/* ── Privacy & Security ────────────────────────────────────────────── */}
        <SettingGroup icon={FaLock} label="Privacy & Security">
          <SettingRow label="Profile visibility" comingSoon />
          <SettingRow label="Block list" comingSoon />
          <SettingRow label="Two-factor auth" comingSoon />
          <ChangePasswordRow user={user} />
        </SettingGroup>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <SettingGroup icon={FaBell} label="Notifications">
          <SettingRow label="Jam invites" comingSoon />
          <SettingRow label="Friend requests" comingSoon />
          <SettingRow label="Messages" comingSoon />
          <SettingRow label="Email digests" comingSoon />
        </SettingGroup>

        {/* ── Appearance ────────────────────────────────────────────────────── */}
        <SettingGroup icon={FaPalette} label="Appearance">
          <SettingRow label="Theme" comingSoon />
          <SettingRow label="Language" comingSoon />
          <SettingRow label="Accessibility" comingSoon />
        </SettingGroup>

        {/* ── Danger zone ───────────────────────────────────────────────────── */}
        <DangerZoneSection user={user} />

      </div>

      {/* ── Sheets ───────────────────────────────────────────────────────────── */}
      <DisplayNameSheet
        open={displayNameOpen}
        onClose={() => setDisplayNameOpen(false)}
        current={user?.display_name}
        onSave={d => handleSave(d, 'Display name')}
      />
      <ProfilePhotoSheet
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        currentUrl={avatarUrl}
        onSave={d => handleSave(d, 'Profile photo')}
      />
      <HeadlineSheet
        open={headlineOpen}
        onClose={() => setHeadlineOpen(false)}
        current={user?.headline}
        onSave={d => handleSave(d, 'Headline')}
      />
      <BioSheet
        open={bioOpen}
        onClose={() => setBioOpen(false)}
        current={user?.about}
        onSave={d => handleSave(d, 'Bio')}
      />
      <SkillLevelSheet
        open={skillOpen}
        onClose={() => setSkillOpen(false)}
        current={user?.skill_level}
        onSave={d => handleSave(d, 'Skill level')}
      />
      <SocialLinksSheet
        open={linksOpen}
        onClose={() => setLinksOpen(false)}
        current={user}
        onSave={d => handleSave(d, 'Links')}
      />

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <SettingsToast toast={toast} />
    </div>
  )
}
