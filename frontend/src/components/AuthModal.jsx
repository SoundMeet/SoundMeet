/**
 * AuthModal
 *
 * Branded auth shell — dark, cinematic, music-native.
 * Controlled via AuthModalContext. Rendered once at app root.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthModal } from '../context/AuthModalContext'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import LogoMark from '../assets/Logo.svg'

// ── Two-dot mode switcher ─────────────────────────────────────────────────────
function ModeDot({ label, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className="auth-modal-dot-btn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px 10px',
        outline: 'none',
        touchAction: 'manipulation',
      }}
    >
      <div
        style={{
          width: active ? '10px' : '7px',
          height: active ? '10px' : '7px',
          borderRadius: '50%',
          background: active ? '#FB4040' : 'rgba(255,255,255,0.16)',
          boxShadow: active
            ? '0 0 6px rgba(251,64,64,0.55), 0 0 14px rgba(251,64,64,0.2)'
            : 'none',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '8.5px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: active ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.14)',
          transition: 'color 0.25s ease',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function AuthModal() {
  const { isOpen, view, closeModal, switchView } = useAuthModal()

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeModal])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 auth-modal-backdrop"
          style={{
            background: 'rgba(0,0,0,0.84)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onPointerDown={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          {/* Ambient glow bloom behind card */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -60%)',
              width: 'min(600px, 100vw)', height: '380px',
              background: 'radial-gradient(ellipse at center, rgba(251,64,64,0.13) 0%, transparent 66%)',
              pointerEvents: 'none',
            }}
          />

          <motion.div
            key="auth-panel"
            role="dialog"
            aria-modal="true"
            aria-label={view === 'login' ? 'Log in to SoundMeet' : view === 'signup' ? 'Create a SoundMeet account' : 'Reset your password'}
            className="auth-modal-panel"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              maxHeight: 'calc(100dvh - 32px)',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              background: '#0b0b0f',
              border: '1px solid rgba(255,255,255,0.065)',
              borderRadius: '28px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.035)',
            }}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Top edge glow line */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0, left: '22%', right: '22%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(251,64,64,0.5), transparent)',
                pointerEvents: 'none',
              }}
            />

            {/* Close button — 44×44 touch target on mobile, 28×28 on desktop */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="auth-modal-close"
              style={{
                position: 'absolute',
                top: '18px', right: '20px',
                width: '28px', height: '28px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '11px',
                transition: 'color 0.15s, background 0.15s',
                zIndex: 10,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.58)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.background = 'none'
              }}
            >
              ✕
            </button>

            {/* Header zone */}
            <div
              className="auth-modal-header"
              style={{
                padding: '32px 32px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Dot switcher — reads first */}
              <div
                role="tablist"
                aria-label="Auth mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  marginBottom: '20px',
                }}
              >
                <ModeDot
                  label="Log in"
                  active={view === 'login'}
                  onClick={() => switchView('login')}
                />
                <ModeDot
                  label="Sign up"
                  active={view === 'signup'}
                  onClick={() => switchView('signup')}
                />
                {view === 'forgot' && (
                  <ModeDot label="Reset" active={true} onClick={() => {}} />
                )}
              </div>

              {/* Logo — below the switcher */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    width: '140px',
                    height: '140px',
                    background: 'radial-gradient(ellipse at center, rgba(220,46,115,0.13) 0%, rgba(251,64,64,0.06) 50%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <img
                  src={LogoMark}
                  alt="SoundMeet"
                  style={{ width: '76px', height: '76px', objectFit: 'contain', position: 'relative' }}
                />
              </div>

              {/* Headline + subline */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view + '-head'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.17, ease: 'easeInOut' }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <h2
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 600,
                      fontSize: '1.05rem',
                      color: '#e8e8e8',
                      margin: 0,
                      letterSpacing: '0em',
                      lineHeight: 1.4,
                    }}
                  >
                    {view === 'login' ? 'Good to see you.' : view === 'signup' ? 'Find your sound.' : 'Reset your password.'}
                  </h2>
                  <p
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontSize: '11.5px',
                      color: 'rgba(255,255,255,0.26)',
                      margin: '3px 0 0',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {view === 'login'
                      ? 'Your music community is waiting.'
                      : view === 'signup'
                      ? 'Join musicians wherever you are.'
                      : "We'll get you back in."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form area */}
            <div className="auth-modal-body" style={{ padding: '20px 32px 36px', overflow: 'hidden' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: view === 'signup' ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: view === 'signup' ? -18 : 18 }}
                  transition={{ duration: 0.17, ease: 'easeInOut' }}
                >
                  {view === 'login' && <LoginForm />}
                  {view === 'signup' && <SignupForm />}
                  {view === 'forgot' && <ForgotPasswordForm onBack={() => switchView('login')} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
