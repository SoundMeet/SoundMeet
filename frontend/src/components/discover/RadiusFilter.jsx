import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RADIUS_OPTIONS } from "../../utils/discoverFilters";

/**
 * RadiusFilter — compact dropdown pill showing the active radius.
 * Clicking opens a small list of radius options.
 *
 * Props:
 *   value        {number}   - Active radius in miles
 *   onChange     {function} - Called with new radius number
 *   onOpenChange {function} - Called with boolean whenever dropdown open state changes
 */
const RadiusFilter = ({ value, onChange, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const setOpenTracked = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenTracked(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpenTracked(!open)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
          ${open
            ? "bg-pink-600 border-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.55)]"
            : "bg-neutral-900/70 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
          }`}
      >
        {/* location dot */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
        <span>{value} mi</span>
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-9 z-50 w-36 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(220,46,115,0.1)] overflow-hidden"
          >
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => { onChange(r); setOpenTracked(false); }}
                className={`w-full px-4 py-2.5 text-xs font-medium text-left transition-colors duration-100
                  ${value === r
                    ? "text-[#DC2E73] bg-white/5"
                    : "text-gray-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
              >
                Within {r} miles
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RadiusFilter;
