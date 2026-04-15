import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Horizontal offset (px) the controls slide when radius dropdown is open.
// Sized to clear the w-36 (144px) dropdown that opens at ~40px from the left edge.
const SLIDE_OFFSET = 164;

// ── Tooltip ────────────────────────────────────────────────────────────────────

const MapTooltip = ({ label }) => (
  <motion.div
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -4 }}
    transition={{ duration: 0.12, ease: "easeOut" }}
    className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50
      whitespace-nowrap px-2.5 py-1.5 rounded-lg
      bg-neutral-900/95 backdrop-blur-md border border-white/10
      text-[11px] font-medium text-white/80
      shadow-[0_4px_16px_rgba(0,0,0,0.5)]
      pointer-events-none"
  >
    {label}
  </motion.div>
);

// ── MapControlButton ───────────────────────────────────────────────────────────

const MapControlButton = ({ onClick, tooltip, accent = false, active = false, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className={`w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-xl
          transition-all duration-200 cursor-pointer
          active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20
          ${accent
            ? "text-white hover:text-[#f07aaa] hover:[filter:drop-shadow(0_0_6px_rgba(220,46,115,0.5))]"
            : "text-neutral-400 hover:text-white"
          }`}
        style={
          active
            ? { color: "#f07aaa", filter: "drop-shadow(0 0 6px rgba(220,46,115,0.5))" }
            : undefined
        }
      >
        {children}
      </button>

      <AnimatePresence>
        {hovered && <MapTooltip label={tooltip} />}
      </AnimatePresence>
    </div>
  );
};

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconRecenter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" fill="currentColor" strokeWidth="0" opacity="0.7" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

const IconReset = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const IconZoomIn = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconZoomOut = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);

// ── MapFloatingControls ────────────────────────────────────────────────────────

/**
 * MapFloatingControls — floating map navigation buttons with custom tooltips.
 * Positioned independently of the jam preview so neither displaces the other.
 *
 * Props:
 *   onRecenter   {function} - Fly to user's location
 *   onReset      {function} - Return to default city view
 *   onZoomIn     {function} - Zoom in one level
 *   onZoomOut    {function} - Zoom out one level
 *   radiusOpen   {boolean}  - When true, slide controls right to avoid overlap with radius dropdown
 */
const MapFloatingControls = ({ onRecenter, onReset, onZoomIn, onZoomOut, radiusOpen = false, recentering = false }) => (
  <motion.div
    animate={{ x: radiusOpen ? SLIDE_OFFSET : 0 }}
    transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
  >
  <div className="flex flex-col items-center py-2 px-1.5 rounded-[1.25rem] bg-neutral-900/55 backdrop-blur-2xl border border-white/10 shadow-[0_0_10px_rgba(220,46,115,0.18),0_4px_24px_rgba(0,0,0,0.5)]">
    <MapControlButton onClick={onRecenter} tooltip="Recenter on you" accent active={recentering}>
      <IconRecenter />
    </MapControlButton>

    <MapControlButton onClick={onReset} tooltip="Reset map view">
      <IconReset />
    </MapControlButton>

    {/* Group divider */}
    <div className="w-5 h-px bg-white/[0.08] my-0.5" />

    <MapControlButton onClick={onZoomIn} tooltip="Zoom in">
      <IconZoomIn />
    </MapControlButton>

    <MapControlButton onClick={onZoomOut} tooltip="Zoom out">
      <IconZoomOut />
    </MapControlButton>
  </div>
  </motion.div>
);

export default MapFloatingControls;
