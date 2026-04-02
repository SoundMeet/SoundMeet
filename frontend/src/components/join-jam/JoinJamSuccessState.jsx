import { motion } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MyJamsIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// ─── JoinJamSuccessState ──────────────────────────────────────────────────────

/**
 * JoinJamSuccessState — in-modal success screen shown after a successful join.
 *
 * Handles both public (confirmed) and private (pending) flows.
 *
 * Props:
 *   jam                 { title }
 *   isPrivate           boolean
 *   onGoToMyJams        () => void
 *   onDownloadCalendar  (() => void) | null  — null hides the calendar button
 *   onClose             () => void
 */
const JoinJamSuccessState = ({
  jam,
  isPrivate,
  onGoToMyJams,
  onDownloadCalendar,
  onClose,
}) => {
  const isConfirmed = !isPrivate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center px-8 py-10"
    >
      {/* Icon circle */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6"
        style={{
          background: isConfirmed
            ? "linear-gradient(135deg, rgba(220,46,115,0.18), rgba(251,64,64,0.12))"
            : "rgba(251,191,36,0.12)",
          color: isConfirmed ? "#DC2E73" : "#F59E0B",
          boxShadow: isConfirmed
            ? "0 0 0 1px rgba(220,46,115,0.2), 0 0 28px rgba(220,46,115,0.08)"
            : "0 0 0 1px rgba(251,191,36,0.2)",
        }}
      >
        <CheckCircleIcon />
      </motion.div>

      {/* Title */}
      <h2 className="text-[22px] font-bold text-white tracking-tight mb-2">
        {isConfirmed ? "You're in!" : "Request sent"}
      </h2>

      {/* Jam name */}
      <p
        className="text-sm font-semibold mb-3"
        style={{ color: "#DC2E73" }}
      >
        {jam?.title}
      </p>

      {/* Body copy */}
      <p
        className="text-sm leading-relaxed mb-8 max-w-[280px]"
        style={{ color: "rgba(229,226,225,0.45)" }}
      >
        {isConfirmed
          ? "You've been added to the jam. It'll appear in My Jams."
          : "The host will review your request. You'll see it in My Jams as pending."}
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
        <button
          onClick={onGoToMyJams}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #DC2E73, #FB4040)" }}
        >
          <MyJamsIcon />
          Go to My Jams
        </button>

        {isConfirmed && onDownloadCalendar && (
          <button
            onClick={onDownloadCalendar}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(229,226,225,0.55)",
            }}
          >
            <CalendarIcon />
            Download Calendar Event
          </button>
        )}

        <button
          onClick={onClose}
          className="text-xs font-medium pt-1 transition-opacity duration-150 hover:opacity-70"
          style={{ color: "rgba(229,226,225,0.28)" }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

export default JoinJamSuccessState;
