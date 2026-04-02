import { hexToRgba, getDiscoveryVariant } from "../../utils/discovery";

/**
 * EventModalHeader — top section of the modal.
 * Renders accent bar, optional cover image, type + status badges, title, close button.
 *
 * Cover image display:
 *   - promote_show with coverImageUrl → full-width hero banner (180px) between accent bar and header body
 *   - all other types with coverImageUrl → 48×48 thumbnail beside the title
 *   - no coverImageUrl → no image rendered (graceful fallback)
 */
const EventModalHeader = ({ item, lifecycle, relationship, accent, onClose }) => {
  const variant        = getDiscoveryVariant(item.type);
  const isShow         = item.type === "promote_show";
  const coverImageUrl  = item.coverImageUrl ?? null;
  const showHero       = isShow && !!coverImageUrl;
  const showThumbnail  = !isShow && !!coverImageUrl;

  return (
    <>
      {/* Accent colour bar */}
      <div
        className="h-[6px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${hexToRgba(accent, 0.5)}, ${accent}, ${hexToRgba(accent, 0.42)})`,
        }}
      />

      {/* Hero banner — promote_show only */}
      {showHero && (
        <div className="relative w-full shrink-0" style={{ height: 180, overflow: "hidden" }}>
          <img
            src={coverImageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            style={{ display: "block" }}
          />
          {/* Gradient fade at the bottom so header text reads cleanly */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: 72,
              background: "linear-gradient(to bottom, transparent, #141414)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Header body */}
      <div className="px-7 pt-6 pb-5 shrink-0">
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Event type badge */}
          <span
            className="inline-flex items-center h-6 px-3 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              color: accent,
              background: hexToRgba(accent, 0.12),
              border: `1px solid ${hexToRgba(accent, 0.22)}`,
            }}
          >
            {variant.label}
          </span>

          {/* Live pulse badge */}
          {lifecycle === "live" && (
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] text-red-400 border border-red-400/20 bg-red-400/10">
              <span
                className="h-1.5 w-1.5 rounded-full bg-red-400"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              />
              Live Now
            </span>
          )}

          {/* Ended badge */}
          {lifecycle === "ended" && (
            <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-neutral-500 border border-white/10">
              Ended
            </span>
          )}

          {/* Cancelled badge */}
          {lifecycle === "cancelled" && (
            <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-red-400 border border-red-400/20 bg-red-400/08">
              Cancelled
            </span>
          )}

          {/* Private badge */}
          {item.isPrivate && (
            <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-neutral-400 border border-white/10">
              Private
            </span>
          )}

          {/* Creator / admin badge */}
          {(relationship === "creator" || relationship === "admin") && (
            <span
              className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium border"
              style={{
                color: accent,
                borderColor: hexToRgba(accent, 0.25),
                background: hexToRgba(accent, 0.08),
              }}
            >
              {relationship === "creator" ? "Your Event" : "Admin"}
            </span>
          )}
        </div>

        {/* Title row — thumbnail sits left of title for non-show types */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Thumbnail — non-show types only */}
            {showThumbnail && (
              <img
                src={coverImageUrl}
                alt=""
                aria-hidden="true"
                className="shrink-0 w-12 h-12 rounded-xl object-cover"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            )}
            <h2
              id="event-detail-title"
              className="text-[1.45rem] font-bold text-white leading-tight tracking-tight"
            >
              {item.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close event details"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default EventModalHeader;
