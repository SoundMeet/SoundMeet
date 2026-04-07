import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { buildSearchIndex, searchDiscoverEntities } from "../../utils/searchDiscoverEntities";
import SearchResultsDropdown from "./SearchResultsDropdown";

const DEBOUNCE_MS = 180;

const SearchIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-neutral-500"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/**
 * DiscoverSearchBar — the main search input for the Discover page.
 *
 * Manages its own dropdown/autocomplete state internally. Reports changes
 * to the parent via `onChange` (for card/pin filtering) and `onResultSelect`
 * (for map fly-to and pin selection).
 *
 * Props:
 *   value           string           — controlled value (from Home's searchQuery)
 *   onChange        (string) => void — notify parent on every keystroke
 *   onResultSelect  (SearchResult) => void — called when user picks a result
 *   allItems        DiscoveryItem[]  — feed to build the search index from
 *   placeholder     string
 */
const DiscoverSearchBar = ({
  value = "",
  onChange,
  onResultSelect,
  allItems = [],
  placeholder = "Search jams, bands, places…",
}) => {
  const [internalQuery, setInternalQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync external value when parent resets it (e.g., clear from outside)
  useEffect(() => {
    if (value !== internalQuery) {
      setInternalQuery(value);
      if (!value) {
        setDebouncedQuery("");
        setIsOpen(false);
      }
    }
    // Intentionally only runs when `value` changes from outside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Build search index — recompute when feed changes (usually stable mock data)
  const index = useMemo(() => buildSearchIndex(allItems), [allItems]);

  // Run search against debounced query
  const results = useMemo(
    () => searchDiscoverEntities(debouncedQuery, index),
    [debouncedQuery, index]
  );

  const flatResults = useMemo(
    () => [...results.pins, ...results.locations],
    [results]
  );

  const hasResults = flatResults.length > 0;
  const showDropdown = isOpen && internalQuery.trim().length > 0 && hasResults;

  // ── Input change ────────────────────────────────────────────────────────────
  const handleChange = (val) => {
    setInternalQuery(val);
    setActiveIndex(-1);
    onChange?.(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
    }, DEBOUNCE_MS);

    setIsOpen(val.trim().length > 0);
  };

  // ── Clear ───────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setInternalQuery("");
    setDebouncedQuery("");
    onChange?.("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // ── Result select ───────────────────────────────────────────────────────────
  const handleResultSelect = (result) => {
    setInternalQuery(result.title);
    setDebouncedQuery(result.title);
    onChange?.(result.title);
    setIsOpen(false);
    setActiveIndex(-1);
    onResultSelect?.(result);
  };

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && flatResults[activeIndex]) {
          handleResultSelect(flatResults[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // ── Click outside closes dropdown ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-2 bg-neutral-800/80 rounded-full
                 px-3.5 py-[7px] min-w-[300px] max-w-[440px] flex-1
                 border border-white/[0.07] transition-all duration-200
                 focus-within:border-white/[0.18] focus-within:bg-neutral-800/95
                 focus-within:shadow-[0_0_0_1px_rgba(220,46,115,0.18)]"
    >
      <SearchIcon />

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={internalQuery}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (internalQuery.trim() && hasResults) setIsOpen(true);
        }}
        className="bg-transparent text-[12.5px] text-white placeholder-neutral-500
                   outline-none w-full min-w-0 leading-none"
        aria-label="Search discover"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        autoComplete="off"
        spellCheck={false}
      />

      {/* Clear button — only when input has content */}
      {internalQuery && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleClear();
          }}
          className="shrink-0 w-[18px] h-[18px] flex items-center justify-center
                     rounded-full bg-neutral-700/80 text-neutral-400 hover:text-white
                     hover:bg-neutral-600/80 transition-colors duration-150"
          aria-label="Clear search"
        >
          <ClearIcon />
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <SearchResultsDropdown
            results={results}
            flatResults={flatResults}
            activeIndex={activeIndex}
            onResultSelect={handleResultSelect}
            onActiveIndexChange={setActiveIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscoverSearchBar;
