import { motion } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────

const MusicNoteIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CheckMark = () => (
  <svg width="8" height="8" viewBox="0 0 12 10" fill="none">
    <path
      d="M1 5l3.5 3.5L11 1"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Options ──────────────────────────────────────────────────────────────────

const OPTIONS = [
  {
    id: "play",
    label: "Play",
    description: "I'll be performing",
    icon: MusicNoteIcon,
  },
  {
    id: "watch",
    label: "Just Watching",
    description: "I'll be in the audience",
    icon: EyeIcon,
  },
];

// ─── JoinTypeSelector ─────────────────────────────────────────────────────────

/**
 * JoinTypeSelector — Play / Watch segmented card selector.
 *
 * Props:
 *   value    "play" | "watch" | null
 *   onChange (type: "play" | "watch") => void
 */
const JoinTypeSelector = ({ value, onChange }) => (
  <div>
    <p
      className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2.5"
      style={{ color: "rgba(229,226,225,0.4)" }}
    >
      Joining as
      <span style={{ color: "#DC2E73" }} aria-hidden>
        {" "}
        *
      </span>
    </p>

    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Join type">
      {OPTIONS.map(({ id, label, description, icon: Icon }) => {
        const active = value === id;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="relative flex flex-col items-center gap-2.5 px-4 py-4 rounded-2xl text-center select-none"
            style={{
              background: active
                ? "rgba(220,46,115,0.1)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                active ? "rgba(220,46,115,0.38)" : "rgba(255,255,255,0.07)"
              }`,
              color: active ? "#DC2E73" : "rgba(229,226,225,0.45)",
              transition: "background 0.18s, border-color 0.18s, color 0.18s",
            }}
          >
            {/* Icon */}
            <span
              style={{
                opacity: active ? 1 : 0.45,
                transition: "opacity 0.18s",
              }}
            >
              <Icon />
            </span>

            {/* Text */}
            <div>
              <p className="text-sm font-semibold leading-tight">{label}</p>
              <p
                className="text-[10px] leading-tight mt-0.5"
                style={{
                  color: active
                    ? "rgba(220,46,115,0.65)"
                    : "rgba(229,226,225,0.28)",
                  transition: "color 0.18s",
                }}
              >
                {description}
              </p>
            </div>

            {/* Active check badge */}
            {active && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "#DC2E73" }}
              >
                <CheckMark />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default JoinTypeSelector;
