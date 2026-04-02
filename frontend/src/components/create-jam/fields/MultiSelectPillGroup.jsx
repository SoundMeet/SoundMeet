import { motion } from "framer-motion";

/**
 * MultiSelectPillGroup — animated pill-based multi-select.
 *
 * Props:
 *   options   {id, label, value, icon?}[]  — option list (injectable from backend later)
 *   selected  string[]                     — selected option ids
 *   onChange  (ids: string[]) => void
 *   showIcons boolean                      — prefix pill with option.icon
 *   disabled  boolean                      — visually dim + non-interactive
 */
const MultiSelectPillGroup = ({
  options = [],
  selected = [],
  onChange,
  showIcons = false,
  disabled = false,
}) => {
  const toggle = (id) => {
    if (disabled) return;
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div
      className="flex flex-wrap gap-2"
      style={{
        transition: "opacity 0.2s",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full select-none"
            style={{
              background: active ? "rgba(220,46,115,0.18)" : "#2A2A2A",
              color: active ? "#DC2E73" : "rgba(229,226,225,0.5)",
              boxShadow: active ? "0 0 0 1px rgba(220,46,115,0.3)" : "none",
              transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
            }}
          >
            {showIcons && opt.icon && (
              <span className="text-sm leading-none">{opt.icon}</span>
            )}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default MultiSelectPillGroup;
