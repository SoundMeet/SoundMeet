import { AnimatePresence, motion } from 'framer-motion'

/**
 * DeleteAccountSheet — confirmation sheet for permanent account deletion.
 * Mirrors DestructiveConfirmSheet visually but adds a credential input:
 *   - Password users: password field
 *   - Google OAuth users: username confirmation field
 *
 * Props:
 *   open             {boolean}
 *   onClose          {Function}
 *   onConfirm        {Function}
 *   loading          {boolean}
 *   isGoogleUser     {boolean}   True when user has no usable password
 *   username         {string}    Current user's username (for Google confirmation)
 *   password         {string}
 *   setPassword      {Function}
 *   confirmUsername  {string}
 *   setConfirmUsername {Function}
 *   error            {string?}   Backend or network error to display inline
 */
export function DeleteAccountSheet({
  open,
  onClose,
  onConfirm,
  loading = false,
  isGoogleUser = false,
  username = '',
  password,
  setPassword,
  confirmUsername,
  setConfirmUsername,
  error,
}) {
  const confirmDisabled = loading || (isGoogleUser
    ? confirmUsername.trim() !== username
    : !password)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="das-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={!loading ? onClose : undefined}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="das-sheet"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="das-title"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 pointer-events-auto"
              style={{ boxShadow: '0 0 60px rgba(0,0,0,0.92), 0 0 24px rgba(251,64,64,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle — mobile only */}
              <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(251,64,64,0.12)', border: '1px solid rgba(251,64,64,0.18)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(251,64,64,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                  <line x1="18" y1="11" x2="23" y2="16"/>
                  <line x1="23" y1="11" x2="18" y2="16"/>
                </svg>
              </div>

              {/* Copy */}
              <h2 id="das-title" className="text-[1.05rem] font-bold text-white mb-1.5">
                Delete your account?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(229,226,225,0.55)' }}>
                This is permanent and cannot be undone. Your profile, jams, bands, and all other data will be erased.
              </p>

              {/* Credential input */}
              <div className="mt-4">
                {isGoogleUser ? (
                  <>
                    <p className="text-xs mb-2" style={{ color: 'rgba(229,226,225,0.4)', fontFamily: 'Sora, sans-serif' }}>
                      Type <strong style={{ color: 'rgba(229,226,225,0.65)' }}>{username}</strong> to confirm
                    </p>
                    <input
                      type="text"
                      placeholder={username}
                      value={confirmUsername}
                      onChange={(e) => setConfirmUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors disabled:opacity-40"
                      style={{ fontFamily: 'Sora, sans-serif' }}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ color: 'rgba(229,226,225,0.4)', fontFamily: 'Sora, sans-serif' }}>
                      Enter your password to confirm
                    </p>
                    <input
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.06] border border-white/10 text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors disabled:opacity-40"
                      style={{ fontFamily: 'Sora, sans-serif' }}
                    />
                  </>
                )}

                {error && (
                  <p className="text-xs mt-2" style={{ color: 'rgba(251,64,64,0.85)', fontFamily: 'Sora, sans-serif' }}>
                    {error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-full text-sm font-semibold transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.6)' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                >
                  Never mind
                </button>
                <button
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className="flex-1 h-10 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'rgba(251,64,64,0.14)', color: 'rgba(251,64,64,0.9)', border: '1px solid rgba(251,64,64,0.22)' }}
                  onMouseEnter={(e) => { if (!confirmDisabled) e.currentTarget.style.background = 'rgba(251,64,64,0.22)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,64,64,0.14)' }}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400/50 border-t-red-400 animate-spin" />
                      Deleting…
                    </>
                  ) : 'Delete account'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
