import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MdLocationOn, MdClose } from 'react-icons/md'
import { usePostLocation } from '../../../hooks/usePostLocation'
import { hexToRgba } from '../../../utils/discovery'

/**
 * PostComposerModal — shared shell for all post creation flows.
 *
 * Wraps the type-specific body (children) with a consistent header,
 * optional location capture row, and a Cancel/Submit footer.
 *
 * Props:
 *   open         boolean
 *   onClose      () => void
 *   title        string          — "Post a Clip", "Invite to Jam", etc.
 *   accent       string          — hex from TYPE_BADGE colors
 *   submitLabel  string          — "Post Clip", "Share", etc.
 *   canSubmit    boolean         — driven by each body's own validation
 *   isSubmitting boolean
 *   onSubmit     (location) => void  — receives location object (or null)
 *   author       { displayName, avatarUrl } — current user
 *   children     ReactNode       — type-specific composer body
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

  // Derive text color — yellow needs dark text, others get white
  const isYellow   = accent === '#F7C10D' || accent === '#FCD34D'
  const buttonText = isYellow ? '#1a1200' : '#ffffff'

  const locationLabel =
    status === 'requesting' ? 'Locating…' :
    status === 'denied'     ? 'Location unavailable' :
    status === 'error'      ? 'Location unavailable' :
    location               ? location.name :
    'Add location'

  const locationClickable = status === 'idle' || status === 'denied' || status === 'error'

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
              className="w-full sm:max-w-lg flex flex-col pointer-events-auto overflow-hidden"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px 24px 0 0',
                maxHeight: '90vh',
                boxShadow: `0 -8px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle — visual only */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Header */}
              <div
                className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Author avatar */}
                {author?.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.displayName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.6)}, ${hexToRgba(accent, 0.3)})` }}
                  >
                    {author?.displayName?.[0] ?? '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white leading-tight">{title}</p>
                  {author && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.35)' }}>
                      as {author.displayName}
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.5)' }}
                >
                  <MdClose className="text-sm" />
                </button>
              </div>

              {/* Scrollable body */}
              <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto px-5 py-4"
                style={{ scrollbarWidth: 'none' }}
              >
                {children}
              </div>

              {/* Location row */}
              <div
                className="px-5 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {status === 'granted' && location ? (
                  /* Location granted — show dismissible chip */
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: hexToRgba(accent, 0.12),
                        color: accent,
                        border: `1px solid ${hexToRgba(accent, 0.25)}`,
                      }}
                    >
                      <MdLocationOn className="text-sm" />
                      {location.name}
                    </span>
                    <button
                      onClick={clearLocation}
                      className="text-[11px] transition-colors hover:opacity-80"
                      style={{ color: 'rgba(229,226,225,0.3)' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  /* Idle / denied / requesting — show pill button */
                  <button
                    onClick={locationClickable ? requestLocation : undefined}
                    disabled={status === 'requesting'}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-all duration-150 disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: status === 'denied' || status === 'error'
                        ? 'rgba(229,226,225,0.25)'
                        : 'rgba(229,226,225,0.45)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <MdLocationOn
                      className="text-sm"
                      style={{
                        color: status === 'denied' || status === 'error'
                          ? 'rgba(229,226,225,0.2)'
                          : accent,
                      }}
                    />
                    {locationLabel}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center gap-3 px-5 pb-5 pt-3 flex-shrink-0"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
              >
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 hover:bg-white/10 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(229,226,225,0.5)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSubmit(location)}
                  disabled={!canSubmit || isSubmitting}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.75)})`,
                    color: buttonText,
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
