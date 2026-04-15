import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const STAR_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Amazing']
const MAX_COMMENT = 280

/**
 * RateJamSheet — overlay sheet for submitting / editing a star review on a past jam.
 *
 * Props:
 *   open      {boolean}
 *   onClose   {Function}
 *   item      {Object}   The past jam / event being rated
 *   onSubmit  {Function} (rating: number, comment: string) => void
 */
export function RateJamSheet({ open, onClose, item, onSubmit }) {
  const [hovered,  setHovered]  = useState(0)
  const [selected, setSelected] = useState(0)
  const [comment,  setComment]  = useState('')

  // Sync initial rating + comment when sheet opens
  useEffect(() => {
    if (open) {
      setSelected(item?.rating ?? 0)
      setComment(item?.ratingComment ?? '')
      setHovered(0)
    }
  }, [open, item])

  const handleSubmit = () => {
    if (!selected) return
    onSubmit(selected, comment.trim())
  }

  const activeStars = hovered || selected

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — sits above EventDetailModal (z-50) */}
          <motion.div
            key="rate-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet — slides up from bottom on mobile, centered on sm+ */}
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="rate-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Rate this jam"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 pointer-events-auto"
              style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile only) */}
              <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />

              {/* Title */}
              <h2 className="text-base font-bold text-white mb-0.5">
                {item?.rating != null ? 'Edit your review' : 'Rate this Jam'}
              </h2>
              <p className="text-xs mb-6 truncate" style={{ color: 'rgba(229,226,225,0.38)' }}>
                {item?.title}
              </p>

              {/* Stars */}
              <div className="flex items-center justify-center gap-3 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(n === selected ? 0 : n)}
                    className="w-11 h-11 flex items-center justify-center transition-all duration-100 hover:scale-110 active:scale-90"
                    style={{
                      fontSize: 36,
                      color: n <= activeStars ? '#DC2E73' : 'rgba(255,255,255,0.12)',
                      filter: n <= activeStars ? 'drop-shadow(0 0 6px rgba(220,46,115,0.5))' : 'none',
                      lineHeight: 1,
                    }}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Star label */}
              <p
                className="text-center text-xs font-medium mb-5 h-4 transition-all duration-150"
                style={{ color: 'rgba(220,46,115,0.85)' }}
              >
                {activeStars ? STAR_LABELS[activeStars - 1] : ''}
              </p>

              {/* Comment textarea */}
              <div
                className="rounded-xl p-3 mb-5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                  placeholder="Share your experience… (optional)"
                  className="w-full bg-transparent text-base sm:text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/20"
                  style={{ caretColor: '#DC2E73' }}
                />
                <p
                  className="text-right text-[10px] mt-1"
                  style={{ color: 'rgba(229,226,225,0.22)' }}
                >
                  {comment.length} / {MAX_COMMENT}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 md:h-10 rounded-full text-sm font-semibold transition-all duration-150 hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.55)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selected}
                  className="flex-1 h-11 md:h-10 rounded-full text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
                >
                  {item?.rating != null ? 'Update' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
