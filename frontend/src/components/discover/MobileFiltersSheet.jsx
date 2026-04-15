import { motion, AnimatePresence } from "framer-motion";
import RadiusFilter from "./RadiusFilter";
import TimeFilter from "./TimeFilter";
import { DEFAULT_MORE_FILTERS, countActiveMoreFilters, INSTRUMENT_OPTIONS, SKILL_LEVEL_OPTIONS, JAM_TYPE_OPTIONS } from "../../utils/discoverFilters";
import GlowSwitch from "../GlowSwitch";

// ── Reusable primitives (mirrors MoreFiltersPopover) ──────────────────────────

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

// ── MobileFiltersSheet ────────────────────────────────────────────────────────

/**
 * MobileFiltersSheet — mobile-only bottom sheet for all discover filters.
 * Replaces the desktop DiscoverToolbar inline controls on small screens.
 *
 * Props mirror the filter props passed to DiscoverControls.
 */
const MobileFiltersSheet = ({
  open,
  onClose,
  radius,
  onRadiusChange,
  onRadiusOpenChange,
  time,
  onTimeChange,
  moreFilters,
  onMoreFiltersChange,
}) => {
  const activeCount = countActiveMoreFilters(moreFilters);

  const toggleMulti = (field, item) => {
    const current = moreFilters[field];
    onMoreFiltersChange({
      ...moreFilters,
      [field]: current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item],
    });
  };

  const handleClearAll = () => {
    onMoreFiltersChange(DEFAULT_MORE_FILTERS);
    onRadiusChange(25);
    onTimeChange("Any Time");
  };

  const hasAnyActive =
    activeCount > 0 || radius !== 25 || time !== "Any Time";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[28px] bg-neutral-950 border-t border-white/[0.09] shadow-[0_-8px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(220,46,115,0.1)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drag handle */}
            <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold text-white">Filters</span>
              <div className="flex items-center gap-3">
                {hasAnyActive && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-neutral-500 hover:text-[#DC2E73] transition-colors duration-150"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-white/[0.07] text-neutral-400 hover:text-white transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l10 10M11 1L1 11" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="h-px bg-white/[0.07] mx-5" />

            {/* Scrollable content */}
            <div className="overflow-y-auto overscroll-contain max-h-[65dvh] px-5 py-4 flex flex-col gap-5">

              {/* Radius */}
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                  Radius
                </p>
                <RadiusFilter
                  value={radius}
                  onChange={onRadiusChange}
                  onOpenChange={onRadiusOpenChange}
                />
              </div>

              <div className="h-px bg-white/[0.07]" />

              {/* Time */}
              <div>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                  When
                </p>
                <TimeFilter value={time} onChange={onTimeChange} />
              </div>

              <div className="h-px bg-white/[0.07]" />

              {/* Instruments */}
              <FilterSection title="Instruments">
                {INSTRUMENT_OPTIONS.map((i) => (
                  <MultiChip
                    key={i}
                    label={i}
                    selected={moreFilters.instruments.includes(i)}
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
                    selected={moreFilters.skillLevels.includes(s)}
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
                    selected={moreFilters.jamTypes.includes(t)}
                    onToggle={() => toggleMulti("jamTypes", t)}
                  />
                ))}
              </FilterSection>

              <div className="h-px bg-white/[0.07]" />

              {/* Toggle controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Include Private Jams</span>
                  <GlowSwitch
                    size="sm"
                    value={moreFilters.includePrivate}
                    onChange={(v) => onMoreFiltersChange({ ...moreFilters, includePrivate: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Beginner Friendly Only</span>
                  <GlowSwitch
                    size="sm"
                    value={moreFilters.beginnerOnly}
                    onChange={(v) => onMoreFiltersChange({ ...moreFilters, beginnerOnly: v })}
                  />
                </div>
              </div>

              {/* Bottom padding buffer */}
              <div className="h-2" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileFiltersSheet;
