import { motion } from "framer-motion";
import { hexToRgba } from "../../utils/discovery";

const ACCENT = "#DC2E73";

/**
 * FirstJamNudge — encourages first-time users to create a jam.
 *
 * Props:
 *   onCreateJam  () => void   — opens CreateJamModal
 *   onDismiss    () => void   — persists dismissal (caller handles localStorage)
 *   variant      "preview" | "empty"
 *     - "preview": compact card for the Home page DiscoverPreview slot
 *     - "empty":   wider card for the MyJams empty state
 */
const FirstJamNudge = ({ onCreateJam, onDismiss, variant = "preview" }) => {
  const isPreview = variant === "preview";

  if (isPreview) {
    return (
      <motion.div
        key="first-jam-nudge"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-[calc(100vw-32px)] max-w-[460px] px-6 py-5 overflow-visible"
      >
        {/* Background fog — matches DiscoverPreview */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            top: "-40px",
            left: "-60px",
            right: "-80px",
            bottom: "-100px",
            background: `
              radial-gradient(
                ellipse 110% 90% at 10% 90%,
                rgba(0,0,0,0.72) 0%,
                rgba(0,0,0,0.52) 30%,
                rgba(0,0,0,0.28) 58%,
                rgba(0,0,0,0.00) 82%
              )
            `,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            width: "360px",
            height: "280px",
            bottom: "-80px",
            left: "-80px",
            background: hexToRgba(ACCENT, 0.28),
            filter: "blur(78px)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "200px",
            height: "180px",
            bottom: "-40px",
            left: "-40px",
            background: hexToRgba(ACCENT, 0.22),
            filter: "blur(50px)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        )}

        {/* Eyebrow */}
        <p
          className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
          style={{
            color: hexToRgba(ACCENT, 0.94),
            textShadow: `0 0 16px ${hexToRgba(ACCENT, 0.3)}`,
          }}
        >
          Your first jam
        </p>

        <h3
          className="text-[1.75rem] font-black text-white leading-tight mb-3 tracking-tight"
          style={{
            textShadow:
              "0 2px 12px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.98), 0 1px 4px rgba(0,0,0,1)",
          }}
        >
          Host a Jam Session
        </h3>

        <p
          className="text-[13.5px] text-gray-300 leading-relaxed mb-6 max-w-[320px]"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,1), 0 2px 24px rgba(0,0,0,1)" }}
        >
          Pick a spot, set a vibe, invite musicians — it takes under a minute.
        </p>

        <button
          onClick={onCreateJam}
          className="inline-flex items-center gap-2.5 px-7 h-12 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, #e8447e)`,
            color: "#FFFFFF",
            boxShadow: `0 0 24px ${hexToRgba(ACCENT, 0.5)}, 0 0 52px ${hexToRgba(ACCENT, 0.18)}, 0 6px 20px rgba(0,0,0,0.70)`,
          }}
        >
          Create a Jam
          <span className="text-base leading-none">→</span>
        </button>
      </motion.div>
    );
  }

  // ── "empty" variant — centered card for MyJams empty state ───────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center text-center py-12 px-6"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(ACCENT, 0.18)}, ${hexToRgba(ACCENT, 0.08)})`,
          boxShadow: `0 0 32px ${hexToRgba(ACCENT, 0.15)}`,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">
        Host your first jam
      </h3>

      <p
        className="text-sm leading-relaxed mb-6 max-w-[300px]"
        style={{ color: "rgba(229,226,225,0.5)" }}
      >
        Pick a spot, set a vibe, and invite musicians. It only takes a minute to get started.
      </p>

      <button
        onClick={onCreateJam}
        className="inline-flex items-center gap-2 px-6 h-11 rounded-full text-[14px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
        style={{
          background: `linear-gradient(135deg, ${ACCENT}, #e8447e)`,
          color: "#FFFFFF",
          boxShadow: `0 0 24px ${hexToRgba(ACCENT, 0.5)}, 0 0 52px ${hexToRgba(ACCENT, 0.18)}, 0 6px 20px rgba(0,0,0,0.70)`,
        }}
      >
        Create a Jam
        <span className="text-base leading-none">→</span>
      </button>
    </motion.div>
  );
};

export default FirstJamNudge;
