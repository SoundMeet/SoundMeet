import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlowSwitch from "../GlowSwitch";
import {
  INSTRUMENT_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  JAM_TYPE_OPTIONS,
  DEFAULT_MORE_FILTERS,
  countActiveMoreFilters,
} from "../../utils/discoverFilters";

// ── Reusable primitives ───────────────────────────────────────────────────────

const MultiChip = ({ label, selected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
      ${selected
        ? "bg-[#DC2E73]/20 border-[#DC2E73]/60 text-[#f07aaa] shadow-[0_0_10px_rgba(220,46,115,0.2)]"
        : "bg-neutral-800/60 border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
      }`}
  >
    {label}
  </button>
);

const FilterSection = ({ title, children }) => (
  <div>
    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
      {title}
    </p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

// ── MoreFiltersPopover ────────────────────────────────────────────────────────

/**
 * MoreFiltersPopover — trigger button + floating panel for advanced filters.
 * Badge on trigger shows count of active filters.
 *
 * Props:
 *   value    {object}   - Current filter state (see DEFAULT_MORE_FILTERS shape)
 *   onChange {function} - Called with updated filter state object
 */
const MoreFiltersPopover = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeCount = countActiveMoreFilters(value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMulti = (field, item) => {
    const current = value[field];
    onChange({
      ...value,
      [field]: current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item],
    });
  };

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
          ${open || activeCount > 0
            ? "bg-[#DC2E73]/15 border-[#DC2E73]/40 text-[#f07aaa] shadow-[0_0_10px_rgba(220,46,115,0.2)]"
            : "bg-neutral-900/70 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
          }`}
      >
        {/* Sliders icon */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 6h16M8 12h8M11 18h2" />
        </svg>
        <span>
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-9 z-50 w-[340px] rounded-3xl bg-neutral-900/96 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(220,46,115,0.15),0_12px_40px_rgba(0,0,0,0.7)] p-5 flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">More Filters</span>
              {activeCount > 0 && (
                <button
                  onClick={() => onChange(DEFAULT_MORE_FILTERS)}
                  className="text-xs text-neutral-500 hover:text-[#DC2E73] transition-colors duration-150"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="h-px bg-white/[0.07]" />

            {/* Instruments */}
            <FilterSection title="Instruments">
              {INSTRUMENT_OPTIONS.map((i) => (
                <MultiChip
                  key={i}
                  label={i}
                  selected={value.instruments.includes(i)}
                  onToggle={() => toggleMulti("instruments", i)}
                />
              ))}
            </FilterSection>

            {/* Skill Level */}
            <FilterSection title="Skill Level">
              {SKILL_LEVEL_OPTIONS.map((s) => (
                <MultiChip
                  key={s}
                  label={s}
                  selected={value.skillLevels.includes(s)}
                  onToggle={() => toggleMulti("skillLevels", s)}
                />
              ))}
            </FilterSection>

            {/* Jam Type */}
            <FilterSection title="Jam Type">
              {JAM_TYPE_OPTIONS.map((t) => (
                <MultiChip
                  key={t}
                  label={t}
                  selected={value.jamTypes.includes(t)}
                  onToggle={() => toggleMulti("jamTypes", t)}
                />
              ))}
            </FilterSection>

            <div className="h-px bg-white/[0.07]" />

            {/* Toggle controls */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">Include Private Jams</span>
                <GlowSwitch
                  size="sm"
                  value={value.includePrivate}
                  onChange={(v) => onChange({ ...value, includePrivate: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">Beginner Friendly Only</span>
                <GlowSwitch
                  size="sm"
                  value={value.beginnerOnly}
                  onChange={(v) => onChange({ ...value, beginnerOnly: v })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoreFiltersPopover;
