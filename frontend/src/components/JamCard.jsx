import AutoScrollPillRow from "./ui/AutoScrollPillRow";

/**
 * JamCard — reusable card for a single jam entry in the Near You panel.
 *
 * Interaction:
 *   - Single click  → selects the jam (persistent preview)
 *   - Double click  → opens jam modal
 *   - Join button   → opens jam modal
 *
 * Long-title behavior:
 *   Title is wrapped in AutoScrollText. If it fits the available width it
 *   renders statically. If it overflows it auto-scrolls at a slow, ambient
 *   pace and freezes on hover so the user can read the full text.
 *
 * Pill overflow behavior:
 *   Tags are rendered via AutoScrollPillRow. If all pills fit they sit in
 *   a normal flex row. If they overflow the component auto-scrolls and
 *   allows manual sideways dragging on hover.
 *
 * Props:
 *   title         {string}   - Jam name
 *   genre         {string}   - Music genre (subtitle line 1)
 *   distanceMiles {number}   - Distance from user in miles
 *   dateTime      {string}   - "Live Now" | "Tonight · 9:00 PM" | etc.
 *   isLive        {boolean}
 *   tags          {string[]} - Display pills (pre-computed, uppercase)
 *   image         {string?}  - Optional thumbnail URL
 *   isPrivate     {boolean}
 *   isActive      {boolean}  - Hovered state (map pin hover)
 *   isSelected    {boolean}  - Selected state (clicked)
 *   onJoin        {function} - Called when Join button is clicked
 *   onClick       {function} - Called on single click
 *   onDoubleClick {function} - Called on double click
 *   onMouseEnter  {function}
 *   onMouseLeave  {function}
 */

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Pulsing "Live" badge with animated indicator dot */
const LiveBadge = () => (
  <span
    className="shrink-0 flex items-center gap-[5px] px-2.5 h-[24px] rounded-full bg-red-600/90 text-white text-[10.5px] font-bold tracking-wide uppercase"
    style={{
      boxShadow:
        "0 0 8px rgba(220,38,38,0.55), 0 0 18px rgba(220,38,38,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
    }}
  >
    <span className="relative flex h-[6px] w-[6px] shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70" />
      <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-white" />
    </span>
    Live
  </span>
);

const MusicNoteIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-neutral-500"
  >
    <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3z" />
  </svg>
);

const Thumbnail = ({ src, alt }) => (
  <div className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0 ring-1 ring-white/[0.08]">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-neutral-700/80 to-neutral-800 flex items-center justify-center">
        <MusicNoteIcon />
      </div>
    )}
  </div>
);

// ── JamCard ────────────────────────────────────────────────────────────────────

const JamCard = ({
  title,
  genre,
  distanceMiles,
  dateTime,
  isLive = false,
  tags = [],
  image,
  isPrivate = false,
  isActive = false,
  isSelected = false,
  onJoin,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const distanceLabel =
    distanceMiles != null
      ? `${distanceMiles} mile${distanceMiles === 1 ? "" : "s"} away`
      : null;

  const metaLine1 = [genre, distanceLabel].filter(Boolean).join(" · ");
  // Suppress "Live Now" on line 2 — the badge already communicates this
  const metaLine2 = dateTime && dateTime !== "Live Now" ? dateTime : null;

  const containerClass = isSelected
    ? "bg-neutral-800/95 border-[#dc2e73]/55 shadow-[0_0_22px_rgba(220,46,115,0.28)]"
    : isActive
    ? "bg-neutral-800/75 border-white/[0.15] shadow-[0_2px_14px_rgba(0,0,0,0.32)]"
    : "bg-neutral-900/85 border-white/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.28)] hover:bg-neutral-800/75 hover:border-white/[0.14]";

  return (
    <div
      className={`rounded-2xl backdrop-blur-sm border px-5 py-4 cursor-pointer transition-all duration-200 ${containerClass}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Top row: thumbnail | title block | badge ── */}
      <div className="flex items-start gap-3">
        <Thumbnail src={image} alt={title} />

        {/* Title block — min-w-0 is essential for truncation/scroll to work */}
        <div className="flex-1 min-w-0 pt-[1px]">
          <h3 className="text-[1rem] font-bold text-white leading-snug truncate">
            {title}
          </h3>
          {metaLine1 && (
            <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
              {metaLine1}
            </p>
          )}
          {metaLine2 && (
            <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
              {metaLine2}
            </p>
          )}
        </div>

        {isLive && <LiveBadge />}
        {isPrivate && !isLive && (
          <span className="shrink-0 flex items-center px-2.5 h-[24px] rounded-full text-[10.5px] font-medium text-gray-500 border border-white/[0.1]">
            Private
          </span>
        )}
      </div>

      {/* ── Pills — auto-scrolls if too many to fit ── */}
      {tags.length > 0 && (
        <AutoScrollPillRow pills={tags} className="mt-3" duration="18s" />
      )}

      {/* ── CTA ── */}
      <div className="mt-3.5">
        {isPrivate ? (
          <button
            disabled
            className="w-full h-[42px] rounded-full bg-neutral-800/80 text-gray-500 font-semibold text-[12px] uppercase tracking-wider border border-white/[0.07] cursor-not-allowed"
          >
            Invite Only
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(e);
            }}
            className="w-full h-[42px] rounded-full bg-[#F7C10D] text-black font-bold text-[12.5px] uppercase tracking-wider transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            style={{
              boxShadow:
                "0 0 16px rgba(247,193,13,0.48), 0 0 36px rgba(247,193,13,0.16), 0 4px 12px rgba(0,0,0,0.38)",
            }}
          >
            Join the Jam
          </button>
        )}
      </div>
    </div>
  );
};

export default JamCard;
