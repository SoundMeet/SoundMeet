import { AnimatePresence, motion } from 'framer-motion'

/**
 * DestructiveConfirmSheet — modal sheet for confirming irreversible actions
 * (leave event, delete event). Sits above EventDetailModal at z-[70].
 *
 * Props:
 *   open          {boolean}
 *   onClose       {Function}    Called when user dismisses without confirming
 *   onConfirm     {Function}    Called when user confirms the action
 *   title         {string}
 *   body          {string}      Main explanation copy
 *   bodyExtra     {string?}     Optional secondary line (e.g. "Jam chat will also be removed")
 *   confirmLabel  {string}      Label for the destructive confirm button
 *   cancelLabel   {string?}     Label for the cancel button (defaults to "Never mind")
 *   loading       {boolean?}    True while the async action is in flight
 */
export function DestructiveConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  body,
  bodyExtra,
  confirmLabel = 'Confirm',
  cancelLabel = 'Never mind',
  loading = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — above EventDetailModal (z-50) */}
          <motion.div
            key="dcs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={!loading ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Sheet — slides up on mobile, centered on sm+ */}
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="dcs-sheet"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="dcs-title"
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
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>

              {/* Copy */}
              <h2 id="dcs-title" className="text-[1.05rem] font-bold text-white mb-1.5">
                {title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(229,226,225,0.55)' }}>
                {body}
              </p>
              {bodyExtra && (
                <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'rgba(229,226,225,0.38)' }}>
                  {bodyExtra}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-full text-sm font-semibold transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.6)' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 h-10 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'rgba(251,64,64,0.14)', color: 'rgba(251,64,64,0.9)', border: '1px solid rgba(251,64,64,0.22)' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(251,64,64,0.22)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,64,64,0.14)' }}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400/50 border-t-red-400 animate-spin" />
                      Working…
                    </>
                  ) : confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
