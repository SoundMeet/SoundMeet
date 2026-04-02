import { MdMusicNote, MdLocationOn } from 'react-icons/md'

/**
 * PostReviewBody — renders a jam review post card.
 *
 * Props:
 *   content    {string}        Optional caption / written review
 *   jamRef     {Object|null}   { id, title, date, locationName }
 *   reviewRef  {Object|null}   { rating: 1-5 }
 */
export function PostReviewBody({ content, jamRef, reviewRef }) {
  const rating = reviewRef?.rating ?? 0

  return (
    <div className="mt-3 space-y-3">
      {/* Jam chip with inline star rating */}
      {jamRef && (
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:brightness-110"
          style={{
            background: 'rgba(220,46,115,0.07)',
            border: '1px solid rgba(220,46,115,0.2)',
          }}
        >
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(220,46,115,0.15)' }}
          >
            <MdMusicNote className="text-sm" style={{ color: '#DC2E73' }} />
          </div>

          {/* Jam info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{jamRef.title}</p>
            {jamRef.locationName && (
              <p
                className="inline-flex items-center gap-1 text-[10px] mt-0.5"
                style={{ color: 'rgba(229,226,225,0.4)' }}
              >
                <MdLocationOn className="text-xs flex-shrink-0" />
                {jamRef.locationName}
              </p>
            )}
          </div>

          {/* Stars */}
          {rating > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="text-sm leading-none"
                  style={{ color: n <= rating ? '#DC2E73' : 'rgba(255,255,255,0.12)' }}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      {content && (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(229,226,225,0.82)' }}>
          {content}
        </p>
      )}
    </div>
  )
}
