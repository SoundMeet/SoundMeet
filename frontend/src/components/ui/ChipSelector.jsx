import React from "react";
import { motion } from "framer-motion";

/**
 * ChipSelector — reusable multi/single-select chip group
 *
 * Props:
 *   options   {id, label, icon?}[]   — items to render
 *   selected  string[]               — currently selected IDs
 *   onChange  (ids: string[]) => void
 *   multi     boolean                — true = multi-select (default false)
 *   showIcon  boolean                — prefix chips with option.icon
 *   shape     "pill" | "rounded"     — pill = 9999px (multi), rounded = 0.75rem (single)
 */
const ChipSelector = ({
  options,
  selected,
  onChange,
  multi = false,
  showIcon = false,
  shape = "pill",
}) => {
  const radius = shape === "pill" ? "9999px" : "0.625rem";

  const toggle = (id) => {
    if (multi) {
      onChange(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id]
      );
    } else {
      // single-select: tap again to deselect
      onChange(selected.includes(id) ? [] : [id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
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
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-3 py-1.5 transition-colors duration-200 select-none"
            style={{
              borderRadius: radius,
              background: active ? "rgba(220,46,115,0.18)" : "#2A2A2A",
              color: active ? "#DC2E73" : "rgba(229,226,225,0.5)",
              boxShadow: active ? "0 0 0 1px rgba(220,46,115,0.3)" : "none",
            }}
          >
            {showIcon && opt.icon && (
              <span className="text-sm leading-none">{opt.icon}</span>
            )}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
