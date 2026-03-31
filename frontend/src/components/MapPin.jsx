const NOTES = ["♩", "♪", "♫", "♬"];

const STATUS = {
  now:   { color: "#d42d84", baseSize: 42, zIndex: 30, pulse: true  },
  soon:  { color: "#d42d84", baseSize: 36, zIndex: 20, pulse: false },
  later: { color: "#eab308", baseSize: 36, zIndex: 10, pulse: false },
};

/**
 * MapPin — map marker for a single jam.
 *
 * Props:
 *   noteIndex  {number}  - Which music note glyph to show (0–3)
 *   status     {string}  - "now" | "soon" | "later" (drives color/pulse)
 *   isSelected {boolean} - Pin is the currently selected jam
 *   isHovered  {boolean} - Pin is currently hovered
 *   onClick    {function}
 *   onMouseEnter {function}
 *   onMouseLeave {function}
 */
const MapPin = ({
  noteIndex = 0,
  status = "later",
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { color, baseSize, zIndex, pulse } = STATUS[status] ?? STATUS.later;
  const note = NOTES[noteIndex % NOTES.length];

  // Scale the pin based on interaction state
  const scale = isSelected ? 1.35 : isHovered ? 1.12 : 1;
  const size = Math.round(baseSize * scale);
  const pinHeight = Math.round(size * 1.35);
  const effectiveZIndex = isSelected ? zIndex + 20 : isHovered ? zIndex + 10 : zIndex;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer"
      style={{
        zIndex: effectiveZIndex,
        // Transform from the bottom anchor point so the pin tip stays planted
        transformOrigin: "bottom center",
        transform: `scale(${scale})`,
        transition: "transform 150ms ease-out",
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // stopPropagation on mousedown so the Home.jsx click-outside handler
      // doesn't fire and deselect the jam before onClick can re-select it
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Selected ring — white halo around the pin head */}
      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: baseSize + 14,
            height: baseSize + 14,
            border: "2.5px solid rgba(255,255,255,0.75)",
            boxShadow: `0 0 12px ${color}99`,
            top: -(baseSize + 14) / 2 + baseSize / 2 - 4,
            left: -(baseSize + 14) / 2 + baseSize / 2,
            borderRadius: "50%",
          }}
        />
      )}

      {/* Pulse ring — only for live "now" jams */}
      {pulse && (
        <div
          className="absolute rounded-full animate-ping opacity-30 pointer-events-none"
          style={{
            width: baseSize + 16,
            height: baseSize + 16,
            backgroundColor: color,
            top: -(baseSize + 16) / 2 + baseSize / 2 - 4,
            left: -(baseSize + 16) / 2 + baseSize / 2,
          }}
        />
      )}

      {/* Pin shape */}
      <svg
        width={size}
        height={pinHeight}
        viewBox="0 0 36 48"
        style={{
          filter: isSelected
            ? `drop-shadow(0 3px 10px ${color}cc) drop-shadow(0 0 6px ${color}88)`
            : `drop-shadow(0 2px 6px ${color}88)`,
          transition: "filter 150ms ease-out",
        }}
      >
        <path
          d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
          fill={color}
        />
        <text
          x="18"
          y="21"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="17"
          fill="white"
        >
          {note}
        </text>
      </svg>
    </div>
  );
};

export default MapPin;
