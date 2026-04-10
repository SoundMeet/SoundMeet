import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MdLocationOn, MdClose } from 'react-icons/md'
import { usePostLocation } from '../../../hooks/usePostLocation'
import { hexToRgba } from '../../../utils/discovery'

/**
 * PostComposerModal — shared shell for all post creation flows.
 *
 * Props:
 *   open         boolean
 *   onClose      () => void
 *   title        string
 *   accent       string hex
 *   submitLabel  string
 *   canSubmit    boolean
 *   isSubmitting boolean
 *   onSubmit     (location) => void
 *   author       { displayName, avatarUrl }
 *   children     ReactNode
 */
export function PostComposerModal({
  open,
  onClose,
  title,
  accent       = '#DC2E73',
  submitLabel  = 'Post',
  canSubmit    = false,
  isSubmitting = false,
  onSubmit,
  author,
  children,
}) {
  const { location, status, requestLocation, clearLocation } = usePostLocation()
  const bodyRef = useRef(null)

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Yellow accent needs dark text on the submit button
  const isYellow   = accent === '#F7C10D' || accent === '#FCD34D'
  const buttonText = isYellow ? '#1a1200' : '#ffffff'

  const locationClickable = status === 'idle' || status === 'denied' || status === 'error'
  const locationLabel =
    status === 'requesting' ? 'Locating…' :
    status === 'denied'     ? 'Unavailable' :
    status === 'error'      ? 'Unavailable' :
    location               ? location.name :
    'Add location'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pcm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              key="pcm-panel"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
              className="w-full sm:max-w-[540px] flex flex-col pointer-events-auto overflow-hidden
                         rounded-t-[24px] sm:rounded-3xl"
              style={{
                background: '#1a1a1a',
                border:     '1px solid rgba(255,255,255,0.08)',
                maxHeight:  '90vh',
                boxShadow:  '0 -8px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
              </div>

              {/* ── Header ──────────────────────────────────────────────── */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Author avatar */}
                {author?.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.6)}, ${hexToRgba(accent, 0.28)})` }}
                  >
                    {author?.displayName?.[0] ?? '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white leading-tight">{title}</p>
                  {author && (
                    <p className="text-[11px] mt-0.5 leading-none" style={{ color: 'rgba(229,226,225,0.3)' }}>
                      {author.displayName}
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0
                             transition-colors hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.4)' }}
                >
                  <MdClose className="text-sm" />
                </button>
              </div>

              {/* ── Scrollable body ──────────────────────────────────────── */}
              <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto px-5 py-4"
                style={{ scrollbarWidth: 'none' }}
              >
                {children}
              </div>

              {/* ── Footer: location (left) + cancel / submit (right) ────── */}
              <div
                className="flex items-center gap-2 px-4 flex-shrink-0"
                style={{
                  borderTop:     '1px solid rgba(255,255,255,0.05)',
                  paddingTop:    10,
                  paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                }}
              >
                {/* Location — secondary metadata action, left-anchored */}
                {status === 'granted' && location ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0 mr-auto">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: hexToRgba(accent, 0.1),
                        color:      accent,
                        border:     `1px solid ${hexToRgba(accent, 0.2)}`,
                      }}
                    >
                      <MdLocationOn className="text-xs" />
                      {location.name}
                    </span>
                    <button
                      onClick={clearLocation}
                      className="text-[10px] transition-opacity hover:opacity-60 flex-shrink-0"
                      style={{ color: 'rgba(229,226,225,0.28)' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={locationClickable ? requestLocation : undefined}
                    disabled={status === 'requesting'}
                    className="inline-flex items-center gap-1 text-[11px] transition-all duration-150
                               disabled:opacity-40 hover:opacity-80 flex-shrink-0 mr-auto"
                    style={{
                      color: status === 'denied' || status === 'error'
                        ? 'rgba(229,226,225,0.18)'
                        : 'rgba(229,226,225,0.35)',
                    }}
                  >
                    <MdLocationOn
                      className="text-sm"
                      style={{
                        color: status === 'denied' || status === 'error'
                          ? 'rgba(229,226,225,0.15)'
                          : hexToRgba(accent, 0.6),
                      }}
                    />
                    {locationLabel}
                  </button>
                )}

                {/* Cancel */}
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150
                             hover:bg-white/[0.06] active:scale-95 flex-shrink-0"
                  style={{ color: 'rgba(229,226,225,0.32)' }}
                >
                  Cancel
                </button>

                {/* Submit — primary CTA */}
                <button
                  onClick={() => onSubmit(location)}
                  disabled={!canSubmit || isSubmitting}
                  className="px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150
                             hover:brightness-110 active:scale-95
                             disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
                             flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.7)})`,
                    color:      buttonText,
                    minWidth:   88,
                  }}
                >
                  {isSubmitting ? 'Posting…' : submitLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
