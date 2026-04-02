import React, { useState, useRef } from "react";
import { hexToRgba } from "../../utils/discovery";
import { motion, AnimatePresence } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const XIcon = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ─── Internal chip primitives ─────────────────────────────────────────────────

const SelectedChip = ({ label, custom, onRemove, accent = "#DC2E73" }) => (
  <motion.button
    type="button"
    onClick={onRemove}
    whileTap={{ scale: 0.93 }}
    transition={{ duration: 0.1 }}
    className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 select-none"
    style={{
      borderRadius: "9999px",
      background: custom ? "rgba(251,64,64,0.1)" : hexToRgba(accent, 0.18),
      color: custom ? "#FB7070" : accent,
      boxShadow: custom
        ? "0 0 0 1px rgba(251,64,64,0.22)"
        : `0 0 0 1px ${hexToRgba(accent, 0.32)}`,
    }}
  >
    {label}
    <XIcon />
  </motion.button>
);

const PresetChip = ({ label, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.94 }}
    transition={{ duration: 0.1 }}
    className="text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 transition-colors duration-150 select-none"
    style={{
      borderRadius: "9999px",
      background: "#2A2A2A",
      color: "rgba(229,226,225,0.48)",
    }}
  >
    {label}
  </motion.button>
);

// ─── SearchableTagSection ─────────────────────────────────────────────────────

/**
 * SearchableTagSection — reusable searchable chip/tag picker.
 *
 * Props:
 *   title            string            — section label
 *   placeholder      string            — search input placeholder
 *   options          {id,label}[]      — preset options
 *   presetIds        string[]          — currently selected preset IDs
 *   customValues     string[]          — currently added custom values
 *   onTogglePreset   (id) => void      — toggle a preset chip
 *   onAddCustom      (value) => void   — add a custom chip
 *   onRemoveCustom   (value) => void   — remove a custom chip
 *   multi            boolean           — allow multiple selections (default true)
 *   maxVisible       number            — max preset chips shown before "show more"
 *   allowCustom      boolean           — show custom-add affordance (default true)
 *   helperText       string?           — optional hint below the title
 *   accent           string?           — hex color for selected chip highlight (default jam pink)
 */
const SearchableTagSection = ({
  title,
  placeholder = "Search…",
  options = [],
  presetIds = [],
  customValues = [],
  onTogglePreset,
  onAddCustom,
  onRemoveCustom,
  multi = true,
  maxVisible = 10,
  allowCustom = true,
  helperText,
  accent = "#DC2E73",
}) => {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef(null);

  const queryTrimmed = query.trim();
  const queryLower = queryTrimmed.toLowerCase();

  // Filter presets by query
  const filtered = queryTrimmed
    ? options.filter((opt) => opt.label.toLowerCase().includes(queryLower))
    : options;

  // Only unselected options appear in the picker area
  const unselected = filtered.filter((opt) => !presetIds.includes(opt.id));

  // Respect maxVisible unless user expanded or is searching
  const showAllPresets = showAll || !!queryTrimmed;
  const visible = showAllPresets
    ? unselected
    : unselected.slice(0, maxVisible);
  const hiddenCount = unselected.length - maxVisible;
  const hasMore = !showAllPresets && hiddenCount > 0;

  // Detect exact matches so we don't prompt "Add custom" when preset exists
  const exactPresetMatch = options.find(
    (o) => o.label.toLowerCase() === queryLower
  );
  const exactCustomMatch = customValues.some(
    (v) => v.toLowerCase() === queryLower
  );
  const showAddCustom =
    allowCustom &&
    queryTrimmed.length > 0 &&
    !exactPresetMatch &&
    !exactCustomMatch;

  const selectedPresets = options.filter((o) => presetIds.includes(o.id));
  const hasSelections = presetIds.length > 0 || customValues.length > 0;

  // Add custom (or select exact preset match) and clear input
  const commitCustom = () => {
    if (!queryTrimmed) return;
    if (exactPresetMatch) {
      if (!presetIds.includes(exactPresetMatch.id)) {
        onTogglePreset(exactPresetMatch.id);
      }
    } else if (!exactCustomMatch) {
      onAddCustom(queryTrimmed);
    }
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showAddCustom) commitCustom();
      else if (exactPresetMatch && !presetIds.includes(exactPresetMatch.id)) {
        onTogglePreset(exactPresetMatch.id);
        setQuery("");
      }
    }
  };

  const handleTogglePreset = (id) => {
    if (!multi && !presetIds.includes(id)) {
      // For single-select: replace selection
      presetIds.forEach((pid) => onTogglePreset(pid));
    }
    onTogglePreset(id);
  };

  return (
    <div className="space-y-2">
      {/* Title */}
      <p
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.35)" }}
      >
        {title}
      </p>

      {/* Helper text */}
      {helperText && (
        <p
          className="text-[11px] leading-relaxed -mt-1"
          style={{ color: "rgba(229,226,225,0.25)" }}
        >
          {helperText}
        </p>
      )}

      {/* Search input */}
      <div className="relative flex items-center">
        <span
          className="absolute left-2.5 pointer-events-none"
          style={{ color: "rgba(229,226,225,0.28)" }}
        >
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (showAll) setShowAll(false); // reset expansion on new search
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full text-[12px] py-1.5 pl-7 pr-3 outline-none transition-colors duration-150"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "0.5rem",
            color: "rgba(229,226,225,0.75)",
            caretColor: accent,
          }}
        />
      </div>

      {/* Selected chips */}
      <AnimatePresence initial={false}>
        {hasSelections && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-1.5 overflow-hidden"
          >
            {selectedPresets.map((opt) => (
              <SelectedChip
                key={opt.id}
                label={opt.label}
                accent={accent}
                onRemove={() => onTogglePreset(opt.id)}
              />
            ))}
            {customValues.map((val) => (
              <SelectedChip
                key={val}
                label={val}
                custom
                accent={accent}
                onRemove={() => onRemoveCustom(val)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset options */}
      {visible.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          style={{
            maxHeight: "120px",
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {visible.map((opt) => (
            <PresetChip
              key={opt.id}
              label={opt.label}
              onClick={() => handleTogglePreset(opt.id)}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {queryTrimmed && filtered.length === 0 && (
        <p
          className="text-[11px]"
          style={{ color: "rgba(229,226,225,0.22)" }}
        >
          No presets match "{queryTrimmed}"
        </p>
      )}

      {/* Show more / Collapse */}
      <div className="flex items-center gap-3">
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[11px] font-medium tracking-wide transition-colors duration-150 hover:opacity-80"
            style={{ color: "rgba(229,226,225,0.3)" }}
          >
            + {hiddenCount} more
          </button>
        )}
        {showAll && !queryTrimmed && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-[11px] font-medium tracking-wide transition-colors duration-150 hover:opacity-80"
            style={{ color: "rgba(229,226,225,0.25)" }}
          >
            Show less
          </button>
        )}

        {/* Add custom affordance */}
        <AnimatePresence>
          {showAddCustom && (
            <motion.button
              type="button"
              onClick={commitCustom}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.12 }}
              className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide transition-colors duration-150 hover:opacity-90"
              style={{ color: "rgba(251,112,112,0.7)" }}
            >
              <PlusIcon />
              Add &ldquo;{queryTrimmed}&rdquo;
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchableTagSection;
