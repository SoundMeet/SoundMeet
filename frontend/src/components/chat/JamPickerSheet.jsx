import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Music, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../injectables/Auth'
import { jamService } from '../../injectables/jamService'

export function JamPickerSheet({ open, onClose, onSelectJam }) {
  const { user } = useAuth()
  const [jams, setJams] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    if (!open || !user?.id) return
    let cancelled = false
    setStatus('loading')

    Promise.all([
      jamService.getMyCreatedJams(user.id),
      jamService.getMyAttendingJams(user.id),
    ])
      .then(([created, attending]) => {
        if (cancelled) return
        const now = new Date()
        const map = new Map()

        // Add created jams (filter to upcoming only, jams only)
        for (const j of created) {
          if (j.type === 'jam' && j.dateTimeRaw && new Date(j.dateTimeRaw) > now) {
            map.set(j.id, j)
          }
        }
        // Add attending jams (already filtered to upcoming by service, but filter to jams only)
        for (const j of attending) {
          if (j.type === 'jam' && !map.has(j.id)) {
            map.set(j.id, j)
          }
        }

        const sorted = [...map.values()].sort(
          (a, b) => new Date(a.dateTimeRaw) - new Date(b.dateTimeRaw),
        )
        setJams(sorted)
        setStatus('done')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => { cancelled = true }
  }, [open, user?.id])

  const handleSelect = (jamId) => {
    onSelectJam(jamId)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="jam-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              key="jam-picker-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Send a jam invite"
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
              <h2 className="text-base font-bold text-white mb-1">Send a Jam Invite</h2>
              <p className="text-xs mb-4" style={{ color: 'rgba(229,226,225,0.38)' }}>
                Pick a jam to share in this chat
              </p>

              {/* Content */}
              <div className="overflow-y-auto -mx-6 px-2" style={{ maxHeight: '55vh' }}>
                {status === 'loading' && (
                  <div className="flex flex-col gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-3.5 w-32 rounded bg-white/5 animate-pulse mb-1.5" />
                          <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <AlertCircle size={28} style={{ color: 'rgba(229,226,225,0.25)' }} />
                    <p className="text-sm" style={{ color: 'rgba(229,226,225,0.38)' }}>
                      Couldn&apos;t load your jams
                    </p>
                  </div>
                )}

                {status === 'done' && jams.length === 0 && (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <Music size={28} style={{ color: 'rgba(229,226,225,0.25)' }} />
                    <p className="text-sm" style={{ color: 'rgba(229,226,225,0.38)' }}>
                      No upcoming jams
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(229,226,225,0.22)' }}>
                      Create or join a jam to share it here
                    </p>
                  </div>
                )}

                {status === 'done' && jams.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {jams.map((jam) => (
                      <button
                        key={jam.id}
                        onClick={() => handleSelect(jam.id)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5 w-full text-left cursor-pointer"
                      >
                        {/* Cover image or placeholder */}
                        {jam.coverImageUrl ? (
                          <img
                            src={jam.coverImageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(220,46,115,0.12)' }}
                          >
                            <Music size={18} style={{ color: '#DC2E73' }} />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#E5E2E1] truncate">
                            {jam.title}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'rgba(229,226,225,0.38)' }}>
                            {jam.dateTime ?? 'Open session'}
                          </p>
                        </div>

                        <ChevronRight size={16} style={{ color: 'rgba(229,226,225,0.2)' }} className="flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
