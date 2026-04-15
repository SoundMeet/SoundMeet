import { motion } from "framer-motion";
import Logo from "../assets/Logo.svg";
import { useAuthModal } from "../context/AuthModalContext.jsx";

/**
 * LocationRequired
 *
 * Full-screen branded gate shown when a guest user denies or blocks geolocation.
 * Handles four sub-states:
 *   promptable  — denied this session, browser will re-prompt on retry
 *   denied      — permanently blocked in browser settings
 *   unavailable — browser has no geolocation API
 */
const LocationRequired = ({ status, onRetry }) => {
  const { openModal } = useAuthModal();
  const isPermanentlyDenied = status === "denied";
  const isUnavailable = status === "unavailable";

  const handlePrimaryClick = () => {
    if (isPermanentlyDenied || isUnavailable) return;
    onRetry();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6 select-none"
      style={{
        background: "rgba(10,10,10,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[28px]"
        style={{
          background: "rgba(18,18,18,0.92)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 40px rgba(220,46,115,0.08)",
        }}
      >

      {/* Ambient glow inside the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 46%, rgba(220,46,115,0.055) 0%, transparent 72%)",
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center px-6 py-10 w-full"
      >

        {/* ── Visual block ─────────────────────────────────────────── */}
        <div className="relative mb-10 flex items-center justify-center" style={{ width: 168, height: 168 }}>

          {/* Muted pulse rings — dim, slow, "offline" feel */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 88,
                height: 88,
                border: "1px solid rgba(220,46,115,0.13)",
              }}
              animate={{
                scale: [1, 1.9, 2.6],
                opacity: [0.28, 0.1, 0],
              }}
              transition={{
                duration: 3.6,
                delay: i * 1.15,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Logo — slightly desaturated & dimmed */}
          <motion.div
            className="relative z-10 flex items-center justify-center"
            style={{ width: 88, height: 88 }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.34, 1.2, 0.64, 1] }}
          >
            <img
              src={Logo}
              alt="SoundMeet"
              className="w-full h-full object-contain"
              style={{
                filter: "grayscale(0.3) brightness(0.58) saturate(0.65)",
              }}
              draggable={false}
            />
          </motion.div>

          {/* Location pin with X — bottom-right badge */}
          <motion.div
            className="absolute bottom-5 right-5 z-20 flex items-center justify-center rounded-full bg-[#1C1B1B]"
            style={{
              width: 34,
              height: 34,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 12px rgba(220,46,115,0.18)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.38, delay: 0.4, ease: [0.34, 1.4, 0.64, 1] }}
          >
            <PinBlockedIcon />
          </motion.div>
        </div>

        {/* ── Text block ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow */}
          <p
            className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-3"
            style={{ color: "rgba(220,46,115,0.55)", fontFamily: "Sora, sans-serif" }}
          >
            Discovery Paused
          </p>

          {/* Headline */}
          <h1
            className="text-white font-bold leading-[1.18] mb-4"
            style={{ fontSize: "clamp(1.65rem, 5vw, 2rem)", fontFamily: "Sora, sans-serif" }}
          >
            {isUnavailable
              ? "Location isn't supported here"
              : "Your next jam is nearby\u2009— we just can't find you yet."}
          </h1>

          {/* Body */}
          <p
            className="leading-relaxed mb-3"
            style={{
              color: "rgba(229,226,225,0.45)",
              fontSize: "0.875rem",
              fontFamily: "Sora, sans-serif",
              maxWidth: 300,
            }}
          >
            {isUnavailable
              ? "SoundMeet's discovery experience relies on location to surface jams, musicians, and music activity near you."
              : "SoundMeet uses your location to show nearby jam sessions, musicians, and local music activity — personalised just for you."}
          </p>

          {/* Contextual note */}
          <p
            className="leading-relaxed mb-8"
            style={{
              color: "rgba(229,226,225,0.25)",
              fontSize: "0.75rem",
              fontFamily: "Sora, sans-serif",
              maxWidth: 290,
            }}
          >
            {isUnavailable
              ? "Try opening SoundMeet in a modern browser like Chrome or Safari to unlock the full experience."
              : isPermanentlyDenied
              ? "Location is blocked in your browser settings. Open your browser settings, find Site Permissions, and allow location for SoundMeet — then hit Enable Location below."
              : "As a guest, location is how we personalise the homepage and let you explore what SoundMeet has to offer."}
          </p>
        </motion.div>

        {/* ── CTA block ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="flex flex-col gap-3 w-full"
          style={{ maxWidth: 296 }}
        >
          {/* Primary — Enable Location (hidden when browser has no geo support) */}
          {!isUnavailable && (
            <button
              onClick={handlePrimaryClick}
              disabled={isPermanentlyDenied}
              className="relative w-full py-3.5 rounded-full text-white text-sm font-semibold transition-all duration-200 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2E73]"
              style={{
                fontFamily: "Sora, sans-serif",
                background: isPermanentlyDenied
                  ? "rgba(220,46,115,0.18)"
                  : "linear-gradient(135deg, #DC2E73 0%, #c4006e 50%, #eb00d0 100%)",
                boxShadow: isPermanentlyDenied
                  ? "none"
                  : "0 0 28px rgba(220,46,115,0.42), 0 2px 8px rgba(0,0,0,0.4)",
                color: isPermanentlyDenied ? "rgba(220,46,115,0.45)" : "#ffffff",
                cursor: isPermanentlyDenied ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isPermanentlyDenied) {
                  e.currentTarget.style.boxShadow =
                    "0 0 40px rgba(220,46,115,0.62), 0 2px 12px rgba(0,0,0,0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isPermanentlyDenied) {
                  e.currentTarget.style.boxShadow =
                    "0 0 28px rgba(220,46,115,0.42), 0 2px 8px rgba(0,0,0,0.4)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              onMouseDown={(e) => {
                if (!isPermanentlyDenied) {
                  e.currentTarget.style.transform = "translateY(0) scale(0.975)";
                }
              }}
              onMouseUp={(e) => {
                if (!isPermanentlyDenied) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
            >
              {/* Shimmer on hover — only active state */}
              {!isPermanentlyDenied && (
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <LocationArrowIcon muted={isPermanentlyDenied} />
                Enable Location
              </span>
            </button>
          )}

          {/* Secondary — Sign In */}
          <button
            onClick={() => openModal('login')}
            className="w-full py-3.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 active:scale-[0.975]"
            style={{
              fontFamily: "Sora, sans-serif",
              color: "rgba(229,226,225,0.7)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(229,226,225,0.95)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(229,226,225,0.7)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            Sign In
          </button>
        </motion.div>

        {/* Create account nudge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.48 }}
          className="mt-5"
          style={{
            color: "rgba(229,226,225,0.2)",
            fontSize: "0.72rem",
            fontFamily: "Sora, sans-serif",
          }}
        >
          New to SoundMeet?{" "}
          <button
            onClick={() => openModal('signup')}
            className="underline underline-offset-2 transition-colors duration-150"
            style={{ color: "rgba(229,226,225,0.38)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(229,226,225,0.65)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(229,226,225,0.38)")
            }
          >
            Create an account
          </button>{" "}
          for a richer experience.
        </motion.p>
      </motion.div>
      </div>
    </div>
  );
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const PinBlockedIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 17 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Pin body */}
    <path
      d="M8.5 1.5C6.015 1.5 4 3.515 4 6C4 9.5 8.5 15.5 8.5 15.5C8.5 15.5 13 9.5 13 6C13 3.515 10.985 1.5 8.5 1.5Z"
      fill="rgba(220,46,115,0.18)"
      stroke="rgba(220,46,115,0.5)"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    {/* X mark inside the pin head */}
    <line
      x1="6.6"
      y1="4.4"
      x2="10.4"
      y2="7.6"
      stroke="rgba(220,46,115,0.75)"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
    <line
      x1="10.4"
      y1="4.4"
      x2="6.6"
      y2="7.6"
      stroke="rgba(220,46,115,0.75)"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
  </svg>
);

const LocationArrowIcon = ({ muted }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="7"
      cy="7"
      r="5.5"
      stroke={muted ? "rgba(220,46,115,0.3)" : "rgba(255,255,255,0.6)"}
      strokeWidth="1.2"
    />
    <circle
      cx="7"
      cy="7"
      r="2"
      fill={muted ? "rgba(220,46,115,0.3)" : "rgba(255,255,255,0.85)"}
    />
  </svg>
);

export default LocationRequired;
