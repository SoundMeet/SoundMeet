import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * ChangePasswordSheet
 *
 * Props:
 *   open              {boolean}
 *   onClose           {Function}
 *   onConfirm         {Function}  async (currentPassword, newPassword, confirmNewPassword) => void
 *   loading           {boolean}
 *   hasUsablePassword {boolean}   false = Google user setting password for first time
 *   error             {string?}
 */
export function ChangePasswordSheet({ open, onClose, onConfirm, loading = false, hasUsablePassword = true, error, onClearError }) {
  const [currentPassword,  setCurrentPassword]  = useState('')
  const [newPassword,      setNewPassword]      = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [showCurrent,      setShowCurrent]      = useState(false)
  const [showNew,          setShowNew]          = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)

  const withClear = (setter) => (val) => { setter(val); onClearError?.() }

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const confirmDisabled = loading
    || !newPassword
    || !confirmPassword
    || newPassword !== confirmPassword
    || (hasUsablePassword && !currentPassword)

  const handleClose = () => {
    if (loading) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(
      hasUsablePassword ? currentPassword : undefined,
      newPassword,
      confirmPassword,
    )
  }

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const PasswordField = ({ label, value, onChange, show, onToggle, autoComplete }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors disabled:opacity-40"
        style={{ fontFamily: 'Sora, sans-serif', paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: show ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.24)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <EyeIcon visible={show} />
      </button>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cps-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="cps-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cps-title"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 pointer-events-auto"
              style={{ boxShadow: '0 0 60px rgba(0,0,0,0.92), 0 0 24px rgba(220,46,115,0.06)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle — mobile only */}
              <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(220,46,115,0.10)', border: '1px solid rgba(220,46,115,0.18)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>

              {/* Copy */}
              <h2 id="cps-title" className="text-[1.05rem] font-bold text-white mb-1.5">
                {hasUsablePassword ? 'Change password' : 'Set a password'}
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(229,226,225,0.55)' }}>
                {hasUsablePassword
                  ? 'Enter your current password, then choose a new one.'
                  : 'Add a password so you can log in without Google.'}
              </p>

              {/* Fields */}
              <div className="flex flex-col gap-2.5">
                {hasUsablePassword && (
                  <PasswordField
                    label="Current password"
                    value={currentPassword}
                    onChange={withClear(setCurrentPassword)}
                    show={showCurrent}
                    onToggle={() => setShowCurrent(v => !v)}
                    autoComplete="current-password"
                  />
                )}
                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={withClear(setNewPassword)}
                  show={showNew}
                  onToggle={() => setShowNew(v => !v)}
                  autoComplete="new-password"
                />
                <div>
                  <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={withClear(setConfirmPassword)}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(v => !v)}
                    autoComplete="new-password"
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs mt-1.5" style={{ color: 'rgba(251,64,64,0.75)', fontFamily: 'Sora, sans-serif' }}>
                      Passwords don't match
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs" style={{ color: 'rgba(251,64,64,0.85)', fontFamily: 'Sora, sans-serif' }}>
                    {error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-full text-sm font-semibold transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.6)' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmDisabled}
                  className="flex-1 h-10 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'rgba(220,46,115,0.14)', color: 'rgba(220,46,115,0.9)', border: '1px solid rgba(220,46,115,0.22)' }}
                  onMouseEnter={e => { if (!confirmDisabled) e.currentTarget.style.background = 'rgba(220,46,115,0.22)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,46,115,0.14)' }}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-pink-400/50 border-t-pink-400 animate-spin" />
                      Saving…
                    </>
                  ) : (hasUsablePassword ? 'Update password' : 'Set password')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
