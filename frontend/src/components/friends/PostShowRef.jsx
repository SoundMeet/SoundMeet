import { MdStars, MdLocationOn, MdCalendarToday } from 'react-icons/md'

/**
 * PostShowRef — inline show reference card rendered on show-type posts.
 *
 * Props:
 *   showRef  { id, title, date?, venueName? }
 */
export function PostShowRef({ showRef }) {
  const { title, date, venueName } = showRef

  const formatted = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl"
      style={{
        background: 'rgba(247,193,13,0.06)',
        border: '1px solid rgba(247,193,13,0.2)',
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(247,193,13,0.15)' }}
      >
        <MdStars className="text-sm" style={{ color: '#F7C10D' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {formatted && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px]"
              style={{ color: 'rgba(229,226,225,0.45)' }}
            >
              <MdCalendarToday className="text-[9px]" />
              {formatted}
            </span>
          )}
          {venueName && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px]"
              style={{ color: 'rgba(229,226,225,0.45)' }}
            >
              <MdLocationOn className="text-[9px]" />
              {venueName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
