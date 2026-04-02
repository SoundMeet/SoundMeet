import { MdStars, MdCalendarToday, MdLocationOn, MdCheck, MdOpenInNew } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'

const ACCENT = '#F7C10D'

// Mock shows created/promoted by the current user
// TODO: replace with api.getMyShows() when backend is ready
const MY_SHOWS = [
  {
    id: 'ms-1',
    title: 'Little Havana Late Set',
    date: '2026-04-11',
    venueName: 'Ball & Chain',
    genres: ['Latin Jazz', 'Afrobeat'],
  },
  {
    id: 'ms-2',
    title: 'Wynwood Rooftop Session',
    date: '2026-04-18',
    venueName: 'The Deck — Wynwood Marketplace',
    genres: ['Indie Soul'],
  },
  {
    id: 'ms-3',
    title: 'Downtown Loft Showcase',
    date: '2026-04-25',
    venueName: 'Flagler Sound Loft',
    genres: ['Alt Pop', 'Indie Rock'],
  },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

/**
 * ShowPromoComposerBody — body for the "Promote Show" composer.
 *
 * Lets the user pick one of their existing shows to promote in the feed,
 * with an optional promo caption. A "Promote a new show" CTA lets them
 * open the dedicated PromoteShowModal (handled by the parent via onCreateNew).
 *
 * Props:
 *   state         { caption: string, selectedShow: object | null }
 *   onChange      (patch) => void
 *   onCreateNew   () => void  — opens PromoteShowModal (parent handles this)
 *
 * Backend note:
 *   MY_SHOWS = GET /api/shows/?author={userId}&upcoming=true
 *   selected show id → posts.show_ref_id (FK → events.id)
 */
export function ShowPromoComposerBody({ state, onChange, onCreateNew }) {
  return (
    <div className="space-y-4">
      {/* Caption */}
      <textarea
        rows={2}
        value={state.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Add a promo note… (optional)"
        className="w-full bg-transparent text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={300}
      />

      {/* Show picker */}
      <div className="space-y-2">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: 'rgba(229,226,225,0.35)' }}
        >
          Select a Show
        </p>

        {MY_SHOWS.map((show) => {
          const selected = state.selectedShow?.id === show.id
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onChange({ selectedShow: selected ? null : show })}
              className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-150"
              style={{
                background: selected ? hexToRgba(ACCENT, 0.08) : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected ? hexToRgba(ACCENT, 0.28) : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected ? hexToRgba(ACCENT, 0.18) : 'rgba(255,255,255,0.06)' }}
              >
                {selected
                  ? <MdCheck style={{ color: ACCENT, fontSize: 18 }} />
                  : <MdStars style={{ color: 'rgba(229,226,225,0.35)', fontSize: 18 }} />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-tight truncate"
                  style={{ color: selected ? '#fff' : 'rgba(229,226,225,0.8)' }}
                >
                  {show.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: 'rgba(229,226,225,0.4)' }}
                  >
                    <MdCalendarToday className="text-xs" />
                    {formatDate(show.date)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: 'rgba(229,226,225,0.4)' }}
                  >
                    <MdLocationOn className="text-xs" />
                    {show.venueName}
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {show.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: selected ? hexToRgba(ACCENT, 0.14) : 'rgba(255,255,255,0.06)',
                        color: selected ? '#1a1200' : 'rgba(229,226,225,0.4)',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Promote a new show CTA */}
      <button
        type="button"
        onClick={onCreateNew}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-colors duration-150"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px dashed ${hexToRgba(ACCENT, 0.25)}`,
          color: hexToRgba(ACCENT, 0.7),
        }}
      >
        <MdOpenInNew className="text-sm" />
        Promote a new show
      </button>
    </div>
  )
}
