/**
 * AuthModal
 *
 * Reusable auth modal shell. Renders at the app root level (in App.jsx)
 * and is controlled via AuthModalContext.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthModal } from '../context/AuthModalContext'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

const PANEL_STYLE = {
  background: 'rgba(18,18,18,0.97)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderRadius: '20px',
  boxShadow:
    '0 24px 64px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.07), 0 0 48px rgba(220,46,115,0.06)',
}

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
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onPointerDown={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <motion.div
            key="auth-panel"
            role="dialog"
            aria-modal="true"
            aria-label={view === 'login' ? 'Log in to SoundMeet' : 'Create a SoundMeet account'}
            className="w-full max-w-sm"
            style={PANEL_STYLE}
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                role="tablist"
                aria-label="Auth mode"
              >
                {[
                  { id: 'login',  label: 'Log in'  },
                  { id: 'signup', label: 'Sign up' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={view === tab.id}
                    onClick={() => switchView(tab.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-1"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      background: view === tab.id ? '#DC2E73' : 'transparent',
                      color: view === tab.id ? '#fff' : 'rgba(255,255,255,0.38)',
                      boxShadow: view === tab.id ? '0 0 12px rgba(220,46,115,0.3)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-1"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>

            {/* ── Title ── */}
            <div className="px-6 pb-4">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                {view === 'login' ? 'Welcome back' : 'Join SoundMeet'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif' }}>
                {view === 'login'
                  ? 'Log in to your account to continue.'
                  : 'Create your account and find your sound.'}
              </p>
            </div>

            {/* ── Form ── */}
            <div className="px-6 pb-6 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: view === 'signup' ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: view === 'signup' ? -16 : 16 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                  {view === 'login' ? <LoginForm /> : <SignupForm />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}