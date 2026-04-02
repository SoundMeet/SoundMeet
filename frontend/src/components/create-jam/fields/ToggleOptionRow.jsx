import { motion } from "framer-motion";

/**
 * ToggleOptionRow — "Open to all X" wildcard toggle chip.
 *
 * When active it signals the host accepts everything in that category.
 * The sibling pill group should be disabled (pass disabled={active} to it).
 *
 * Props:
 *   active   boolean
 *   label    string     — e.g. "All Genres Welcome"
 *   onToggle () => void
 */
const ToggleOptionRow = ({ active, label, onToggle }) => (
  <motion.button
    type="button"
    onClick={onToggle}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.12, ease: "easeOut" }}
    className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide select-none"
    style={{
      background: active ? "rgba(220,46,115,0.15)" : "rgba(255,255,255,0.04)",
      color: active ? "#DC2E73" : "rgba(229,226,225,0.35)",
      boxShadow: active
        ? "0 0 0 1px rgba(220,46,115,0.35)"
        : "0 0 0 1px rgba(255,255,255,0.08)",
      transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
    }}
  >
    <span style={{ fontSize: 10, lineHeight: 1, opacity: active ? 1 : 0.5 }}>
      {active ? "✓" : "✦"}
    </span>
    {label}
  </motion.button>
);

export default ToggleOptionRow;
