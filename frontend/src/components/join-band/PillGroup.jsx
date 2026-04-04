import { motion } from "framer-motion";
import { hexToRgba } from "../../utils/discovery";

/**
 * PillGroup — accent-aware pill selector for the Join a Band form.
 *
 * Supports both single-select and multi-select modes with the form's
 * purple accent color.
 *
 * Props:
 *   options   {id, label}[]
 *   selected  string | null | string[]  — null/string when multi=false; string[] when multi=true
 *   onChange  (string | null | string[]) => void
 *   multi     boolean  — allow multiple selections (default false)
 *   accent    string   — hex accent color
 */
const PillGroup = ({
  options  = [],
  selected,
  onChange,
  multi    = false,
  accent   = "#8B5CF6",
}) => {
  const selectedArr = multi
    ? (Array.isArray(selected) ? selected : [])
    : (selected ? [selected] : []);

  const toggle = (id) => {
    if (multi) {
      const next = selectedArr.includes(id)
        ? selectedArr.filter((i) => i !== id)
        : [...selectedArr, id];
      onChange(next);
    } else {
      onChange(selectedArr[0] === id ? null : id);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selectedArr.includes(opt.id);
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full select-none"
            style={{
              background: active ? hexToRgba(accent, 0.18) : "#2A2A2A",
              color:      active ? accent : "rgba(229,226,225,0.5)",
              boxShadow:  active ? `0 0 0 1px ${hexToRgba(accent, 0.32)}` : "none",
              transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
            }}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default PillGroup;
