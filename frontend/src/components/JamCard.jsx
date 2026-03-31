/**
 * JamCard — reusable card for a single jam entry in the Near You panel.
 *
 * Interaction:
 *   - Single click  → selects the jam (persistent preview)
 *   - Double click  → opens jam modal
 *   - Join button   → opens jam modal (bubbles up to onClick too, which is fine)
 *
 * Props:
 *   title         {string}   - Jam name
 *   genre         {string}   - Music genre
 *   distanceMiles {number}   - Distance from user in miles
 *   isLive        {boolean}  - Whether the jam is currently live
 *   tags          {string[]} - Short tag pills (e.g. ["IMPROV", "BEBOP"])
 *   isPrivate     {boolean}  - Show private indicator instead of join button
 *   isActive      {boolean}  - Hovered state (mouse is over this card)
 *   isSelected    {boolean}  - Selected state (user clicked this card)
 *   onJoin        {function} - Called when Join the Jam button is clicked
 *   onClick       {function} - Called on single click (select)
 *   onDoubleClick {function} - Called on double click (open modal)
 *   onMouseEnter  {function} - Hover enter
 *   onMouseLeave  {function} - Hover leave
 */
const JamCard = ({
  title,
  genre,
  distanceMiles,
  isLive = false,
  tags = [],
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

  const meta = [genre, distanceLabel].filter(Boolean).join(" · ");

  // Visual state priority: selected > active (hovered) > default
  const containerClass = isSelected
    ? "bg-neutral-800/95 border-[#dc2e73]/60 shadow-[0_0_28px_rgba(220,46,115,0.40)]"
    : isActive
    ? "bg-neutral-800/70 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    : "bg-neutral-900/80 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-neutral-800/70 hover:border-white/20";

  return (
    <div
      className={`rounded-3xl backdrop-blur-md border px-4 py-4 cursor-pointer transition-all duration-200 ${containerClass}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Title row */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-lg font-light bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight truncate">
            {title}
          </h3>
          {meta && (
            <p className="text-xs font-medium text-gray-500 mt-0.5">{meta}</p>
          )}
        </div>

        {isLive && (
          <button className="bg-red-500 px-3 h-5 text-xs font-medium rounded-xl text-white shadow-[0_0_10px_rgba(239,68,68,0.8),0_0_20px_rgba(239,68,68,0.5)] animate-pulse shrink-0 mt-0.5">
            Live
          </button>
        )}

        {isPrivate && !isLive && (
          <span className="text-[10px] font-medium text-gray-500 border border-white/10 rounded-xl px-2 h-5 flex items-center shrink-0 mt-0.5">
            Private
          </span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="h-7 flex items-center justify-center rounded-xl text-xs w-max px-2.5 backdrop-blur-md border border-white/10 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {isPrivate ? (
        <button
          disabled
          className="mt-3 w-full h-11 rounded-3xl bg-neutral-800 text-gray-500 font-semibold text-sm border border-white/10 cursor-not-allowed"
        >
          INVITE ONLY
        </button>
      ) : (
        <button
          onClick={onJoin}
          className="mt-3 w-full h-11 rounded-3xl bg-[#F7C10D] text-black font-semibold text-sm shadow-[0_0_10px_rgba(247,193,13,0.8),0_0_25px_rgba(247,193,13,0.5)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
        >
          JOIN THE JAM
        </button>
      )}
    </div>
  );
};

export default JamCard;
