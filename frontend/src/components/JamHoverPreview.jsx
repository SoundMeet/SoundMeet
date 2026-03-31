import { motion } from "framer-motion";

/**
 * JamHoverPreview — floating editorial teaser shown when hovering a jam card.
 * Positioned fixed in the lower-left corner, sitting directly on the map.
 * Designed to feel like a branded promo overlay, not a UI card.
 *
 * Glow philosophy:
 *   All glow comes from individually positioned circular blobs behind specific
 *   content zones. No glow is applied to the container itself — this prevents
 *   the rectangular box silhouette. Each blob is a circle (border-radius: 50%)
 *   with a large blur, so the eye reads soft ambient light, not a panel halo.
 *
 * Props:
 *   jam       {object}   - The full jam data object to preview
 *   onViewJam {function} - Called when "View Jam" is clicked
 *                          TODO: hook this up to the jam detail modal
 */
const JamHoverPreview = ({ jam, onViewJam }) => {
  if (!jam) return null;

  const pills = [jam.genre, jam.vibe].filter(Boolean).slice(0, 2);

  // Shared blob style — circular, blurred, pointer-events-none, behind content
  const blob = (overrides) => ({
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: -1,
    ...overrides,
  });

  return (
    <motion.div
      key={jam.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      // overflow-visible so blobs can bleed beyond the content bounds
      className="relative w-[460px] px-6 py-5 overflow-visible"
    >
      {/*
       * BLOB A — main corner bloom, anchored off the bottom-left.
       * Pushed partially outside the component so only its upper-right
       * edge spills in diagonally. Glow is strongest at the corner and
       * fades as it travels up and right — never centers behind content.
       */}
      <div
        style={blob({
          width: "360px",
          height: "280px",
          bottom: "-80px",
          left: "-80px",
          background: "rgba(210, 40, 105, 0.32)",
          filter: "blur(78px)",
        })}
      />

      {/*
       * BLOB B — tighter corner accent, same anchor.
       * Sits slightly inside Blob A to add a brighter hotspot
       * right at the corner without spreading evenly behind the text.
       */}
      <div
        style={blob({
          width: "200px",
          height: "180px",
          bottom: "-40px",
          left: "-40px",
          background: "rgba(220, 46, 115, 0.26)",
          filter: "blur(50px)",
        })}
      />

      {/*
       * BLOB C — wide, very faint outer atmosphere also corner-anchored.
       * Creates a broad cinematic light spill up the left edge and across
       * the bottom without wrapping around the whole preview.
       */}
      <div
        style={blob({
          width: "520px",
          height: "320px",
          bottom: "-120px",
          left: "-120px",
          background: "rgba(190, 30, 90, 0.13)",
          filter: "blur(95px)",
        })}
      />

      {/* Pills */}
      <div className="flex items-center gap-3 mb-5">
        {pills.map((pill, i) => (
          <span key={pill} className="flex items-center gap-3">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#e8447e]"
              style={{ textShadow: "0 0 20px rgba(220,46,115,0.75)" }}
            >
              {pill}
            </span>
            {i < pills.length - 1 && (
              <span
                className="inline-block w-1 h-1 rounded-full"
                style={{ background: "rgba(232,68,126,0.45)" }}
              />
            )}
          </span>
        ))}
      </div>

      {/* Title — deep text-shadow stack replaces any dark panel backing */}
      <h3
        className="text-[2.75rem] font-black text-white leading-[1.02] mb-4 uppercase tracking-tight"
        style={{
          textShadow:
            "0 2px 24px rgba(0,0,0,1), 0 0 48px rgba(0,0,0,0.95), 0 1px 6px rgba(0,0,0,0.9)",
        }}
      >
        {jam.title}
      </h3>

      {/* Description */}
      <p
        className="text-[14px] text-gray-300 leading-relaxed mb-7 max-w-[340px]"
        style={{ textShadow: "0 1px 16px rgba(0,0,0,1), 0 0 32px rgba(0,0,0,0.9)" }}
      >
        {jam.description}
      </p>

      {/* CTA — TODO: replace onClick with open jam detail modal handler */}
      <button
        onClick={onViewJam}
        className="inline-flex items-center gap-2.5 px-7 h-12 rounded-full bg-gradient-to-r from-[#dc2e73] to-[#e8447e] text-white text-[15px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
        style={{
          boxShadow:
            "0 0 24px rgba(220,46,115,0.60), 0 0 52px rgba(220,46,115,0.18), 0 6px 20px rgba(0,0,0,0.70)",
        }}
      >
        View Jam
        <span className="text-base leading-none">→</span>
      </button>
    </motion.div>
  );
};

export default JamHoverPreview;
