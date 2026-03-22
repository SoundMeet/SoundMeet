import React from "react";

const NOTES = ["♩", "♪", "♫", "♬"];

const STATUS = {
  now:  { color: "#d42d84", size: 42, zIndex: 30, pulse: true  },
  soon: { color: "#d42d84", size: 36, zIndex: 20, pulse: false },
  later:{ color: "#eab308", size: 36, zIndex: 10, pulse: false },
};

const MapPin = ({ noteIndex = 0, status = "later", onClick }) => {
  const { color, size, zIndex, pulse } = STATUS[status];
  const note = NOTES[noteIndex % NOTES.length];
  const pinHeight = Math.round(size * 1.35);

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ zIndex }}
      onClick={onClick}
    >
      {/* Pulse ring — only for "now" */}
      {pulse && (
        <div
          className="absolute rounded-full animate-ping opacity-30 pointer-events-none"
          style={{
            width: size + 16,
            height: size + 16,
            backgroundColor: color,
            top: -(size + 16) / 2 + size / 2 - 4,
            left: -(size + 16) / 2 + size / 2,
          }}
        />
      )}

      {/* Pin shape */}
      <svg
        width={size}
        height={pinHeight}
        viewBox="0 0 36 48"
        className="drop-shadow-lg group-hover:scale-110 transition-transform duration-150"
        style={{ filter: `drop-shadow(0 2px 6px ${color}88)` }}
      >
        {/* Teardrop path */}
        <path
          d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
          fill={color}
        />
        {/* Music note */}
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
