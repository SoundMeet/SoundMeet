import { motion, AnimatePresence } from 'framer-motion'
import { MdMusicNote, MdCalendarToday, MdLocationOn, MdCheck } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'

const ACCENT = '#DC2E73'

// Mock upcoming jams owned by / joined by the current user
// TODO: replace with api.getMyJams() when backend is ready
const MY_JAMS = [
  {
    id: 'mj-1',
    title: 'Saturday Funk Collective',
    date: '2026-04-05',
    locationName: 'Wynwood Arts District',
    genres: ['Funk', 'Soul'],
  },
  {
    id: 'mj-2',
    title: 'Late Night Jazz Improv',
    date: '2026-04-07',
    locationName: 'Little Havana',
    genres: ['Jazz'],
  },
  {
    id: 'mj-3',
    title: 'Sunday Acoustic Session',
    date: '2026-04-13',
    locationName: 'Coconut Grove',
    genres: ['Acoustic', 'Folk'],
  },
  {
    id: 'mj-4',
    title: 'Groove Lab Session #5',
    date: '2026-04-18',
    locationName: 'Midtown Miami',
    genres: ['R&B', 'Neo Soul'],
  },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

/**
 * JamInviteComposerBody — body for the "Invite to Jam" composer.
 *
 * Props:
 *   state    { message: string, selectedJam: object | null }
 *   onChange (patch) => void
 *
 * Backend note:
 *   MY_JAMS should be fetched from GET /api/jams/?author={userId}&upcoming=true
 *   The selected jam's id maps to posts.jam_ref_id (FK → events.id).
 */
export function JamInviteComposerBody({ state, onChange }) {
  return (
    <div className="space-y-4">
      {/* Message */}
      <textarea
        rows={3}
        value={state.message}
        onChange={(e) => onChange({ message: e.target.value })}
        placeholder="Write a message to go with the invite… (optional)"
        className="w-full bg-transparent text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={300}
      />

      {/* Jam picker */}
      <div className="space-y-2">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: 'rgba(229,226,225,0.35)' }}
        >
          Select a Jam
        </p>
        <div className="space-y-2">
          {MY_JAMS.map((jam, i) => {
            const selected = state.selectedJam?.id === jam.id
            return (
              <motion.button
                key={jam.id}
                type="button"
                onClick={() => onChange({ selectedJam: selected ? null : jam })}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.055, type: 'spring', stiffness: 400, damping: 28 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors duration-150"
                style={{
                  background: selected ? hexToRgba(ACCENT, 0.1) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? hexToRgba(ACCENT, 0.3) : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                  style={{
                    background: selected ? hexToRgba(ACCENT, 0.2) : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {selected ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 20 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        <MdCheck style={{ color: ACCENT, fontSize: 18 }} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="note"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        <MdMusicNote style={{ color: 'rgba(229,226,225,0.35)', fontSize: 18 }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight truncate transition-colors duration-150"
                    style={{ color: selected ? '#fff' : 'rgba(229,226,225,0.8)' }}
                  >
                    {jam.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: 'rgba(229,226,225,0.4)' }}
                    >
                      <MdCalendarToday className="text-xs" />
                      {formatDate(jam.date)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: 'rgba(229,226,225,0.4)' }}
                    >
                      <MdLocationOn className="text-xs" />
                      {jam.locationName}
                    </span>
                  </div>
                  {/* Genre tags */}
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {jam.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-150"
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
