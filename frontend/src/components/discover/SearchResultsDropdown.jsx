import { motion } from "framer-motion";

const TYPE_DOT_COLORS = {
  jam: "#DC2E73",
  show: "#F7C10D",
  musician: "#8B5CF6",
  band: "#14B8A6",
  location: "#6B7280",
};

const TYPE_LABELS = {
  jam: "Jam",
  show: "Show",
  musician: "Musician",
  band: "Band",
  location: "Place",
};

const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-500">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
  </svg>
);

const ResultItem = ({ result, isActive, globalIndex, onSelect, onMouseEnter }) => {
  const dotColor = TYPE_DOT_COLORS[result.type] ?? "#6B7280";
  const typeLabel = TYPE_LABELS[result.type] ?? result.type;
  const isLocation = result.type === "location";

  return (
    <button
      // Use onMouseDown so it fires before onBlur closes the dropdown
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(result);
      }}
      onMouseEnter={() => onMouseEnter(globalIndex)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
        isActive ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
      }`}
    >
      {/* Type indicator */}
      {isLocation ? (
        <span className="shrink-0 mt-0.5">
          <PinIcon />
        </span>
      ) : (
        <span
          className="w-[7px] h-[7px] rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: dotColor }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[13px] text-white font-medium truncate flex-1 min-w-0">
            {result.title}
          </span>
          <span className="text-[10px] text-neutral-600 shrink-0 font-medium uppercase tracking-wide">
            {typeLabel}
          </span>
        </div>
        {result.subtitle && (
          <div className="text-[11.5px] text-neutral-500 truncate mt-0.5 leading-snug">
            {result.subtitle}
          </div>
        )}
      </div>
    </button>
  );
};

const SectionLabel = ({ label }) => (
  <div className="px-4 pt-3 pb-1">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
      {label}
    </span>
  </div>
);

/**
 * SearchResultsDropdown — autocomplete results panel for DiscoverSearchBar.
 *
 * Props:
 *   results       { pins: SearchResult[], locations: SearchResult[] }
 *   flatResults   SearchResult[]   — all results in order (for keyboard nav index)
 *   activeIndex   number           — currently keyboard-highlighted global index
 *   onResultSelect (result) => void
 *   onActiveIndexChange (n) => void
 */
const SearchResultsDropdown = ({
  results,
  flatResults,
  activeIndex,
  onResultSelect,
  onActiveIndexChange,
}) => {
  const hasPins = results.pins.length > 0;
  const hasLocations = results.locations.length > 0;

  // Build a global index offset for locations (they come after pins)
  const locationOffset = results.pins.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="absolute left-0 top-[calc(100%+8px)] w-full min-w-[320px] rounded-2xl
                 bg-neutral-950/98 backdrop-blur-2xl
                 border border-white/[0.08]
                 shadow-[0_12px_48px_rgba(0,0,0,0.75),0_0_24px_rgba(220,46,115,0.12)]
                 overflow-hidden z-[60] pb-2"
    >
      {hasPins && (
        <>
          <SectionLabel label="Pins & Events" />
          {results.pins.map((result, i) => (
            <ResultItem
              key={result.id}
              result={result}
              isActive={activeIndex === i}
              globalIndex={i}
              onSelect={onResultSelect}
              onMouseEnter={onActiveIndexChange}
            />
          ))}
        </>
      )}

      {hasPins && hasLocations && (
        <div className="mx-4 my-1 h-px bg-white/[0.06]" />
      )}

      {hasLocations && (
        <>
          <SectionLabel label="Places" />
          {results.locations.map((result, i) => (
            <ResultItem
              key={result.id}
              result={result}
              isActive={activeIndex === locationOffset + i}
              globalIndex={locationOffset + i}
              onSelect={onResultSelect}
              onMouseEnter={onActiveIndexChange}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

export default SearchResultsDropdown;
