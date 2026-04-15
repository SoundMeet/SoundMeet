import { motion, AnimatePresence } from 'framer-motion'
import { MdStars, MdClose } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'
import { useEligibleEvents } from '../../../hooks/useEligibleEvents'
import { useAuth } from '../../../injectables/Auth'
import { EventInviteCard } from '../../event-invite/EventInviteCard'

const ACCENT = '#F7C10D'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

// ── Section divider ────────────────────────────────────────────────────────────

function GroupDivider({ label }) {
  return (
    <div className="flex items-center gap-2.5 my-2">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.12em] flex-shrink-0"
        style={{ color: 'rgba(229,226,225,0.2)' }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

// ── Single unselected show row ─────────────────────────────────────────────────

function ShowRow({ show, onSelect, index }) {
  const dateStr = formatDate(show.dateTimeRaw ?? show.date)
  const venue   = show.venueName ?? show.locationName ?? show.neighborhood ?? null
  const meta    = [dateStr, venue].filter(Boolean).join(' · ')

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(show)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.985 }}
      className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-left transition-colors duration-150"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border:     '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background  = hexToRgba(ACCENT, 0.05)
        e.currentTarget.style.borderColor = hexToRgba(ACCENT, 0.18)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <MdStars style={{ color: 'rgba(229,226,225,0.28)', fontSize: 15 }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold leading-tight truncate"
          style={{ color: 'rgba(229,226,225,0.82)' }}
        >
          {show.title}
        </p>
        {meta && (
          <p
            className="text-[11px] leading-tight truncate mt-0.5"
            style={{ color: 'rgba(229,226,225,0.35)' }}
          >
            {meta}
          </p>
        )}
      </div>

      {/* Select indicator */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{
          border:     '1.5px solid rgba(255,255,255,0.12)',
          background: 'transparent',
        }}
      />
    </motion.button>
  )
}

// ── Selected show — transforms into the invite card preview ───────────────────

function SelectedShowCard({ show, onDeselect }) {
  return (
    <motion.div
      key="selected"
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="relative"
    >
      <EventInviteCard
        type="show"
        id={String(show.id)}
        compact={false}
        previewOnly={true}
      />
      {/* Deselect */}
      <button
        type="button"
        onClick={onDeselect}
        aria-label="Remove selection"
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors hover:bg-white/20"
        style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(229,226,225,0.8)' }}
      >
        <MdClose style={{ fontSize: 10 }} />
      </button>
    </motion.div>
  )
}

// ── Skeleton rows ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: '62%' }} />
        <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '42%' }} />
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-1.5 py-7 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
    >
      <MdStars style={{ fontSize: 26, color: 'rgba(229,226,225,0.18)' }} />
      <p className="text-[12px]" style={{ color: 'rgba(229,226,225,0.35)' }}>
        No upcoming shows to promote
      </p>
      <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.2)' }}>
        Create or RSVP to a show first
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * ShowPromoComposerBody
 *
 * State: { caption: string, selectedShow: NormalizedItem | null }
 *
 * When a show is selected, its row transforms into the rich EventInviteCard
 * preview inline. Other rows remain compact. Deselect via the × button.
 */
export function ShowPromoComposerBody({ state, onChange }) {
  const { user } = useAuth()
  const { loading, yours, attending } = useEligibleEvents(user?.id, 'show')

  const selectedId = state.selectedShow ? String(state.selectedShow.id) : null
  const allEmpty   = !loading && yours.length === 0 && attending.length === 0

  const allShows  = [...yours, ...attending]
  const dividerAt = yours.length

  const renderRow = (show, globalIndex, localIndex) => {
    const isSelected = selectedId === String(show.id)

    if (isSelected) {
      return (
        <div key={show.id}>
          <SelectedShowCard
            show={show}
            onDeselect={() => onChange({ selectedShow: null })}
          />
        </div>
      )
    }

    return (
      <div key={show.id}>
        <ShowRow
          show={show}
          onSelect={(s) => onChange({ selectedShow: s })}
          index={localIndex}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Optional promo note */}
      <textarea
        rows={2}
        value={state.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Add a promo note… (optional)"
        className="w-full bg-transparent text-base sm:text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={300}
      />

      {/* Show picker */}
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3"
          style={{ color: 'rgba(229,226,225,0.42)' }}
        >
          Select a Show
        </p>

        {loading ? (
          <div className="space-y-1.5">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        ) : allEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-1.5">
            {allShows.map((show, i) => {
              const localIndex  = i < dividerAt ? i : i - dividerAt
              const showDivider = dividerAt > 0 && i === dividerAt && attending.length > 0

              return (
                <div key={show.id}>
                  {showDivider && <GroupDivider label="Also Going To" />}
                  <AnimatePresence mode="wait" initial={false}>
                    {renderRow(show, i, localIndex)}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
