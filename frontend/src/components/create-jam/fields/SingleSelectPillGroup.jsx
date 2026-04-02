import { motion } from "framer-motion";

/**
 * SingleSelectPillGroup — animated pill-based single-select.
 * Tap an active pill again to deselect it (allows clearing).
 *
 * Props:
 *   options   {id, label, value, icon?}[]  — option list
 *   selected  string|null                  — selected option id
 *   onChange  (id: string|null) => void
 *   disabled  boolean
 */
const SingleSelectPillGroup = ({
  options = [],
  selected = null,
  onChange,
  disabled = false,
}) => {
  const toggle = (id) => {
    if (disabled) return;
    onChange(selected === id ? null : id);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-3 py-1.5 select-none"
            style={{
              borderRadius: "0.625rem",
              background: active ? "rgba(220,46,115,0.18)" : "#2A2A2A",
              color: active ? "#DC2E73" : "rgba(229,226,225,0.5)",
              boxShadow: active ? "0 0 0 1px rgba(220,46,115,0.3)" : "none",
              transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
            }}
          >
            {opt.icon && (
              <span className="text-sm leading-none">{opt.icon}</span>
            )}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default SingleSelectPillGroup;
