import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { geocodePlaces } from "../../../services/maptiler/geocodePlaces";
import { mapTilerResultToPlace } from "../../../adapters/mapTilerResultToPlace";
import { formatSelectedLocationDisplay } from "../../../utils/formatLocationDisplay";
import { rankLocationResults } from "../../../utils/rankLocationResults";

const DEBOUNCE_MS = 300;
const MIN_CHARS   = 3;

// ─── MapLocationSearchInput ───────────────────────────────────────────────────
/**
 * Props:
 *   query           string                              — controlled search text
 *   selectedPlace   object|null                         — confirmed selection
 *   mapCenter       { latitude, longitude }|null        — current map/area center;
 *                   used as the proximity bias origin for local-biased mode.
 *                   Falls back to device geolocation when null.
 *   onQueryChange   (q: string) => void
 *   onSelect        (place: Place) => void
 *   onClear         () => void
 *   error           string|undefined
 */
const MapLocationSearchInput = ({
  query,
  selectedPlace,
  mapCenter,
  onQueryChange,
  onSelect,
  onClear,
  error,
}) => {
  const [results,     setResults]     = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [fetchError,  setFetchError]  = useState(null);
  const [isOpen,      setIsOpen]      = useState(false);
  const [noResults,   setNoResults]   = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);

  // 'local-biased' | 'global' — drives both API proximity and client ranking
  const [searchMode, setSearchMode] = useState("local-biased");

  // Refs for use inside runSearch (avoids stale closures in useCallback)
  const searchModeRef  = useRef("local-biased");
  const mapCenterRef   = useRef(null);
  const proximityRef   = useRef(null); // device geolocation fallback

  // Ref on the INPUT ROW only — excludes error/helper text below it
  const inputRowRef   = useRef(null);
  const dropdownRef   = useRef(null);
  const debounceTimer = useRef(null);

  // Keep mapCenterRef in sync with the mapCenter prop
  useEffect(() => {
    mapCenterRef.current = mapCenter ?? null;
  }, [mapCenter]);

  // Device geolocation — best-effort; used when mapCenter is unavailable
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        proximityRef.current = { latitude: coords.latitude, longitude: coords.longitude };
      },
      () => {},
      { timeout: 5000, maximumAge: 300_000 },
    );
  }, []);

  // Effective center: map-derived center takes precedence over raw device geo
  const getEffectiveCenter = () => mapCenterRef.current ?? proximityRef.current;

  // ── Core search ─────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < MIN_CHARS) {
      setResults([]); setNoResults(false); setIsOpen(false); return;
    }

    const mode   = searchModeRef.current;
    const center = getEffectiveCenter();

    // Local-biased: bias the API request toward the effective center.
    // Global: send no proximity so the provider returns its own ranked results.
    const proximity = mode === "local-biased" ? center : null;

    setIsLoading(true); setFetchError(null); setNoResults(false);
    try {
      const features = await geocodePlaces(q, { proximity });
      const places   = features.map(mapTilerResultToPlace);
      const context  = mode === "local-biased" && center ? { center } : null;
      const ranked   = rankLocationResults(places, q, context, mode);
      setResults(ranked);
      setIsOpen(ranked.length > 0);
      if (ranked.length === 0) setNoResults(true);
    } catch (err) {
      console.error("[LocationSearch]", err);
      setFetchError("Search unavailable — please try again.");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (selectedPlace) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
  }, [query, selectedPlace, runSearch]);

  // ── Mode switch ─────────────────────────────────────────────────────────────
  const switchMode = (newMode) => {
    searchModeRef.current = newMode;
    setSearchMode(newMode);
    if (query.trim().length >= MIN_CHARS) runSearch(query);
  };

  // ── Dropdown position (position:fixed, viewport-relative) ──────────────────
  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const el = inputRowRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, results]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        !inputRowRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    onQueryChange(val);
    setNoResults(false);
    if (!val) {
      setResults([]); setIsOpen(false);
      // Reset mode on full clear so a fresh search starts locally biased
      searchModeRef.current = "local-biased";
      setSearchMode("local-biased");
    }
  };

  const handleSelect = (place) => {
    onSelect(place);
    setResults([]);
    setIsOpen(false);
    setNoResults(false);
  };

  const handleClear = () => {
    onClear();
    setResults([]);
    setIsOpen(false);
    setFetchError(null);
    setNoResults(false);
  };

  // ── Selected state ──────────────────────────────────────────────────────────
  if (selectedPlace) {
    const { primaryLabel, secondaryLabel } = formatSelectedLocationDisplay(selectedPlace);
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-start gap-3 p-3 rounded-xl"
          style={{ background: "rgba(220,46,115,0.08)", boxShadow: "0 0 0 1px rgba(220,46,115,0.22)" }}
        >
          <span className="flex-shrink-0 mt-0.5 text-base" style={{ color: "#DC2E73" }}>📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-snug">
              {primaryLabel}
            </p>
            <p
              className="text-[11px] mt-0.5 leading-snug"
              style={{
                color: "rgba(229,226,225,0.4)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {secondaryLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear location"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-150"
            style={{ color: "rgba(229,226,225,0.4)", fontSize: 11 }}
          >
            ✕
          </button>
        </motion.div>
        {error && <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>{error}</p>}
      </div>
    );
  }

  // ── Search state ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Input row */}
      <div ref={inputRowRef} className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(229,226,225,0.28)", fontSize: 14 }}
        >
          🔍
        </span>
        <input
          type="text"
          className="jam-input pl-9 pr-9"
          placeholder="Search venues, parks, addresses…"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-spin"
            style={{ color: "rgba(229,226,225,0.35)", fontSize: 15, display: "inline-block" }}
          >
            ⟳
          </span>
        )}
      </div>

      {/* Status messages */}
      {!isLoading && !fetchError && !noResults && query.length > 0 && query.length < MIN_CHARS && (
        <p className="text-[11px] mt-1.5 ml-1" style={{ color: "rgba(229,226,225,0.25)" }}>
          Keep typing to search…
        </p>
      )}
      {fetchError && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>{fetchError}</p>
      )}
      {noResults && (
        <p className="text-[11px] mt-1.5 ml-1" style={{ color: "rgba(229,226,225,0.3)" }}>
          No places found — try a different search.
        </p>
      )}
      {error && !isOpen && !noResults && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>{error}</p>
      )}

      {/* ── Dropdown — portalled into Dialog.Content (outside card) ────────────
       *
       * Portal target: #jam-dropdown-portal — a fixed-inset div sitting
       * INSIDE Dialog.Content's DOM but OUTSIDE the modal card.
       *
       * WHY inside Dialog.Content: Radix only fires onPointerDownOutside /
       * onFocusOutside when the event target is outside Dialog.Content's DOM
       * subtree. By portalling here, result clicks are "inside" → Radix never
       * tries to dismiss the modal. No event-suppression hacks needed.
       *
       * WHY outside the card: the card has backdropFilter:blur(32px) which
       * per CSS spec creates a containing block for position:fixed children,
       * causing them to be clipped by overflow-y:auto. The portal container
       * has no transform/filter, so position:fixed is viewport-relative. ✓
       *
       ───────────────────────────────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {isOpen && results.length > 0 && dropdownPos && (
            <motion.div
              key="loc-dropdown"
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position:     "fixed",
                top:          dropdownPos.top,
                left:         dropdownPos.left,
                width:        dropdownPos.width,
                zIndex:       99999,
                maxHeight:    300,
                overflowY:    "auto",
                borderRadius: "0.875rem",
                background:   "rgba(18,18,18,0.98)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow:    "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
                scrollbarWidth: "none",
                pointerEvents: "auto",
              }}
            >
              {/* ── Result rows ── */}
              {results.map((place, i) => {
                const { primaryLabel, secondaryLabel } = formatSelectedLocationDisplay(place);
                return (
                  <button
                    key={place.id ?? i}
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                    style={{
                      borderBottom: i < results.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span
                      className="flex-shrink-0 mt-[3px]"
                      style={{ color: "rgba(220,46,115,0.7)", fontSize: 13 }}
                    >
                      📍
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[13px] font-semibold leading-snug"
                        style={{
                          color: "rgba(229,226,225,0.92)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {primaryLabel}
                      </p>
                      <p
                        className="text-[11px] mt-0.5 leading-snug"
                        style={{
                          color: "rgba(229,226,225,0.35)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {secondaryLabel}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* ── Mode toggle footer ─────────────────────────────────────────
               * onMouseDown preventDefault keeps the dropdown open when clicking
               * the toggle (the input would otherwise lose focus → dropdown closes).
               ────────────────────────────────────────────────────────────────── */}
              <div
                style={{
                  borderTop:   "1px solid rgba(255,255,255,0.05)",
                  padding:     "7px 16px",
                  display:     "flex",
                  alignItems:  "center",
                  gap:         5,
                }}
              >
                <span style={{ fontSize: 11, color: "rgba(229,226,225,0.28)" }}>
                  {searchMode === "local-biased" ? "Nearby results" : "All results"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(229,226,225,0.16)" }}>·</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    switchMode(searchMode === "local-biased" ? "global" : "local-biased")
                  }
                  style={{
                    fontSize:   11,
                    color:      "rgba(220,46,115,0.75)",
                    background: "none",
                    border:     "none",
                    padding:    0,
                    cursor:     "pointer",
                  }}
                >
                  {searchMode === "local-biased" ? "Show all" : "Search nearby"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById("jam-dropdown-portal") ?? document.body,
      )}
    </div>
  );
};

export default MapLocationSearchInput;
