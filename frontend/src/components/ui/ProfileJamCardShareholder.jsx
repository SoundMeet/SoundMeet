// components/JamCard.jsx
//
// Props:
//   jam          – { id, name, description, location, tags, date }
//   onSelect     – (jam) => void      called on tap/click (no drag)
//   dragHandlers – { onMouseDown, onTouchStart }  from Profile's drag logic
//   isDragging   – boolean            true while this card is being dragged
//   dragX        – number             current horizontal pixel offset
//   movedRef     – ref                true immediately after a drag ends;
//                                     used to skip onClick after a swipe
 
import React from "react";
import Tag from "./Tag";
import { isUpcoming, TRACKING_COLOR, ATTENDED_COLOR } from "../utils/jamUtils";
 
const JAM_DRAG_THRESHOLD = 140;
 
const JamCard = ({ jam, onSelect, dragHandlers, isDragging, dragX, movedRef }) => {
  const tracking  = isUpcoming(jam.date);
  const fillColor = tracking ? TRACKING_COLOR + "99" : ATTENDED_COLOR + "99";
  const offsetX   = isDragging ? dragX : 0;
 
  // dragProgress goes 0→1 as the card approaches the delete threshold.
  // Used to show the "Release to delete" hint and the red tint.
  const dragProgress = Math.min(Math.abs(offsetX) / JAM_DRAG_THRESHOLD, 1);
 
  const formattedDate = new Date(jam.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
 
  return (
    // Outer wrapper is position:relative so the absolute overlays
    // (red tint, hint text) are scoped to this card — same pattern
    // as the snippet cards in Profile.
    <div className="relative">
 
      {/* ── Drag overlays (pointer-events-none so they don't block drag) ── */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
        {isDragging && (
          <div
            className="absolute inset-0 rounded-2xl bg-red-500/20 transition-opacity"
            style={{ opacity: dragProgress }}
          />
        )}
        {isDragging && dragProgress > 0.45 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-red-300">Release to delete</span>
          </div>
        )}
      </div>
 
      {/* ── Card ── */}
      <button
        {...dragHandlers}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => {
          // Same guard as snippet cards: if the user just finished a drag,
          // movedRef.current is true — skip the click so the stub doesn't
          // open on swipe release.
          if (!movedRef.current) onSelect(jam);
          movedRef.current = false;
        }}
        className={`jam-card-hover text-left w-full flex flex-col justify-between min-h-35 rounded-2xl bg-neutral-800 p-4 gap-3 border transition-all duration-500 cursor-pointer ${
          tracking
            ? "border-yellow-500/30 shadow-[0_0_20px_rgba(207,169,44,0.25)]"
            : "border-pink-500/30 shadow-[0_0_20px_rgba(220,46,115,0.25)]"
        }`}
        style={{
          "--jam-fill": fillColor,
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "pan-y",   // tells browser: vertical = scroll, horizontal = ours
          transform: `translateX(${offsetX}px) rotate(${offsetX * 0.02}deg)`,
          opacity: isDragging ? 1 - Math.abs(offsetX) / 320 : 1,
          transition: isDragging
            ? "none"
            : "transform 0.25s ease, opacity 0.25s ease, box-shadow 0.5s, border-color 0.5s",
        }}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-base text-white font-semibold leading-tight">{jam.name}</h3>
          <p className="text-xs text-neutral-200">{jam.description}</p>
          <p className="text-xs text-neutral-300">{jam.location}</p>
 
          {jam.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {jam.tags.map((tag) => (
                <Tag key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
 
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white">{formattedDate}</span>
          <span
            className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${
              tracking
                ? "bg-[linear-gradient(to_right,#CFA92C,#E0CE94)] text-black"
                : "bg-[linear-gradient(to_right,#C430A9,#C27399)] text-white"
            }`}
          >
            {tracking ? "Tracking" : "Attended"}
          </span>
        </div>
      </button>
    </div>
  );
};
 
export default JamCard;