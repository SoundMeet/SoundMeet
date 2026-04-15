import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdMusicNote, MdCalendarToday, MdLocationOn, MdCheck } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'
import { jamService } from '../../../injectables/jamService'

const ACCENT = '#FB923C'
const STAR_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Amazing']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/**
 * ReviewComposerBody — body for the "Write a Review" composer modal.
 *
 * Props:
 *   state         { caption: string, selectedJam: object|null, rating: number }
 *   onChange      (patch) => void
 *   currentUserId {string|number|undefined}
 */
export function ReviewComposerBody({ state, onChange, currentUserId }) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [pastJams, setPastJams] = useState([])
  const activeStars = hoveredStar || state.rating

  useEffect(() => {
    if (!currentUserId) return
    jamService.getMyPastJams(currentUserId)
      .then((jams) => {
        setPastJams(
          (jams ?? []).map((j) => ({
            id: j.id,
            title: j.title,
            date: j.dateTimeRaw,
            locationName: j.locationName,
            genres: (j.genres ?? []).map((g) => g.name ?? g),
          }))
        )
      })
      .catch(() => {})
  }, [currentUserId])

  return (
    <div className="space-y-5">
      {/* Caption */}
      <textarea
        rows={3}
        value={state.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Tell people what made this jam memorable…"
        className="w-full bg-transparent text-base sm:text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={280}
      />

      {/* Star picker */}
      <div>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2"
          style={{ color: 'rgba(229,226,225,0.35)' }}
        >
          Your Rating
        </p>
        <div className="flex items-center gap-2.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => onChange({ rating: n === state.rating ? 0 : n })}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center transition-all duration-100 hover:scale-110 active:scale-90"
              style={{
                fontSize: 30,
                color: n <= activeStars ? ACCENT : 'rgba(255,255,255,0.13)',
                filter: n <= activeStars ? `drop-shadow(0 0 5px ${hexToRgba(ACCENT, 0.45)})` : 'none',
                lineHeight: 1,
              }}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
          {activeStars > 0 && (
            <span className="text-xs ml-1 transition-all duration-150" style={{ color: hexToRgba(ACCENT, 0.8) }}>
              {STAR_LABELS[activeStars - 1]}
            </span>
          )}
        </div>
      </div>

      {/* Past jam picker */}
      <div>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2"
          style={{ color: 'rgba(229,226,225,0.35)' }}
        >
          Select a Past Jam
        </p>
        <div className="space-y-2">
          {pastJams.map((jam, i) => {
            const selected = state.selectedJam?.id === jam.id
            return (
              <motion.button
                key={jam.id}
                type="button"
                onClick={() => onChange({ selectedJam: selected ? null : jam })}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-start gap-3 p-3.5 sm:p-3 rounded-xl text-left transition-colors duration-150"
                style={{
                  background: selected ? hexToRgba(ACCENT, 0.1) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? hexToRgba(ACCENT, 0.3) : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                  style={{ background: selected ? hexToRgba(ACCENT, 0.2) : 'rgba(255,255,255,0.06)' }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {selected ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        <MdCheck style={{ color: ACCENT, fontSize: 17 }} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="note"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        <MdMusicNote style={{ color: 'rgba(229,226,225,0.35)', fontSize: 17 }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Jam info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight truncate transition-colors duration-150"
                    style={{ color: selected ? '#fff' : 'rgba(229,226,225,0.8)' }}
                  >
                    {jam.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: 'rgba(229,226,225,0.38)' }}
                    >
                      <MdCalendarToday className="text-[10px]" />
                      {formatDate(jam.date)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: 'rgba(229,226,225,0.38)' }}
                    >
                      <MdLocationOn className="text-[10px]" />
                      {jam.locationName}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {jam.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-all duration-150"
                        style={{
                          background: selected ? hexToRgba(ACCENT, 0.15) : 'rgba(255,255,255,0.06)',
                          color: selected ? ACCENT : 'rgba(229,226,225,0.4)',
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
