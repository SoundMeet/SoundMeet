import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { geocodePlaces }              from "../../../services/maptiler/geocodePlaces";
import { mapTilerResultToPlace }      from "../../../adapters/mapTilerResultToPlace";
import { formatSelectedLocationDisplay, formatDistanceMiles } from "../../../utils/formatLocationDisplay";
import { rankLocationResults, haversineKm }                   from "../../../utils/rankLocationResults";
import { getRecentVenues, saveRecentVenue }                   from "../../../utils/recentVenues";

const DEBOUNCE_MS              = 280;
const MIN_CHARS                = 3;
const NEARBY_RADIUS_KM         = 96.56;  // 60 miles — hard cutoff for "Nearby" label
const SEARCH_AREA_THRESHOLD_KM = 3;      // map must move this far to show "Search this area"

// ─── MapLocationSearchInput ───────────────────────────────────────────────────
/**
 * Props:
 *   query             string                              — controlled search text
 *   selectedPlace     object|null                         — confirmed selection
 *   mapCenter         { latitude, longitude }|null        — current map/area center
 *   mapBounds         { north, south, east, west }|null  — current visible map bounds
 *   onQueryChange     (q: string) => void
 *   onSelect          (place: Place) => void
 *   onClear           () => void
 *   onCustomLocation  () => void                          — switch to manual entry mode
 *   error             string|undefined
 *   portalId          string                              — id of the dropdown portal div
 *   searchPlaceholder string                              — input placeholder text
 */
const MapLocationSearchInput = ({
  query,
  selectedPlace,
  mapCenter,
  mapBounds,
  onQueryChange,
  onSelect,
  onClear,
  onCustomLocation,
  error,
  portalId          = "location-dropdown-portal",
  searchPlaceholder = "Search venues, parks, addresses…",
}) => {
  const [results,        setResults]        = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [fetchError,     setFetchError]     = useState(null);
  const [isOpen,         setIsOpen]         = useState(false);
  const [noResults,      setNoResults]      = useState(false);
  const [dropdownPos,    setDropdownPos]    = useState(null);
  const [searchMode,     setSearchMode]     = useState("local-biased");
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [isFocused,      setIsFocused]      = useState(false);
  const [recents,        setRecents]        = useState([]);

  // Refs for use inside async callbacks (avoid stale closures)
  const searchModeRef       = useRef("local-biased");
  const mapCenterRef        = useRef(null);
  const mapBoundsRef        = useRef(null);
  const proximityRef        = useRef(null);   // device geolocation fallback
  const lastSearchCenterRef = useRef(null);   // center at time of last search

  const inputRowRef   = useRef(null);
  const dropdownRef   = useRef(null);
  const debounceTimer = useRef(null);
  const abortCtrlRef  = useRef(null);         // current in-flight request controller

  // Keep map context refs in sync with props
  useEffect(() => { mapCenterRef.current = mapCenter ?? null; }, [mapCenter]);
  useEffect(() => { mapBoundsRef.current = mapBounds ?? null; }, [mapBounds]);

  // "Search this area" — surface when the map has moved far enough from the last search
  useEffect(() => {
    if (!mapCenter || !lastSearchCenterRef.current) { setShowSearchArea(false); return; }
    if (!query || query.trim().length < MIN_CHARS)   { setShowSearchArea(false); return; }
    if (selectedPlace)                               { setShowSearchArea(false); return; }

    const km = haversineKm(
      lastSearchCenterRef.current.latitude,
      lastSearchCenterRef.current.longitude,
      mapCenter.latitude,
      mapCenter.longitude,
    );
    setShowSearchArea(km > SEARCH_AREA_THRESHOLD_KM);
  }, [mapCenter, query, selectedPlace]);

  // Device geolocation — best-effort fallback when mapCenter is unavailable
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        proximityRef.current = { latitude: coords.latitude, longitude: coords.longitude };
      },
      () => {},
      { timeout: 5000, maximumAge: 300_000 },
    );
  }, []);

  // Effective center: map-derived takes precedence over raw device geo
  const getEffectiveCenter = () => mapCenterRef.current ?? proximityRef.current;

  // ── Core search ─────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < MIN_CHARS) {
      setResults([]); setNoResults(false); setIsOpen(false); return;
    }

    // Cancel any in-flight request
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    const mode   = searchModeRef.current;
    const center = getEffectiveCenter();

    // Bias the API toward the effective center in local mode
    const proximity = mode === "local-biased" ? center : null;

    setIsLoading(true); setFetchError(null); setNoResults(false);

    try {
      const features = await geocodePlaces(q, { proximity, signal: ctrl.signal });
      if (ctrl.signal.aborted) return; // another search superseded this one

      const places  = features.map(mapTilerResultToPlace);
      const bounds  = mapBoundsRef.current;
      const context = mode === "local-biased" && center
        ? { center, ...(bounds ? { bounds } : {}) }
        : null;

      const ranked = rankLocationResults(places, q, context, mode);

      // Record where this search was biased toward (for "Search this area" detection)
      if (center) lastSearchCenterRef.current = center;
      setShowSearchArea(false);

      setResults(ranked);
      setIsOpen(true);
      setNoResults(ranked.length === 0);
    } catch (err) {
      if (err?.name === "AbortError") return;
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

  // Load recents when input is focused with an empty query
  useEffect(() => {
    if (isFocused && !query && !selectedPlace) {
      setRecents(getRecentVenues());
    } else {
      setRecents([]);
    }
  }, [isFocused, query, selectedPlace]);

  // ── Mode switch ─────────────────────────────────────────────────────────────
  const switchMode = (newMode) => {
    searchModeRef.current = newMode;
    setSearchMode(newMode);
    if (query.trim().length >= MIN_CHARS) runSearch(query);
  };

  // ── "Search this area" ───────────────────────────────────────────────────────
  const handleSearchThisArea = () => {
    setShowSearchArea(false);
    runSearch(query);
  };

  // ── Dropdown position (position:fixed, viewport-relative) ──────────────────
  useLayoutEffect(() => {
    if (!isOpen && recents.length === 0) return;
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
  }, [isOpen, recents.length, results]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const active = isOpen || recents.length > 0;
    if (!active) return;
    const handler = (e) => {
      if (
        !inputRowRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
        setRecents([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, recents.length]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    onQueryChange(val);
    setNoResults(false);
    setRecents([]);
    if (!val) {
      setResults([]); setIsOpen(false); setShowSearchArea(false);
      searchModeRef.current = "local-biased";
      setSearchMode("local-biased");
    }
  };

  const handleSelect = (place) => {
    saveRecentVenue(place);
    onSelect(place);
    setResults([]);
    setIsOpen(false);
    setNoResults(false);
    setShowSearchArea(false);
    setRecents([]);
  };

  const handleClear = () => {
    abortCtrlRef.current?.abort();
    onClear();
    setResults([]);
    setIsOpen(false);
    setFetchError(null);
    setNoResults(false);
    setShowSearchArea(false);
    setRecents([]);
  };

  // ── Distance from current origin (used for recents) ─────────────────────────
  const distanceFromCenter = (place) => {
    const center = getEffectiveCenter();
    if (!center) return null;
    return haversineKm(center.latitude, center.longitude, place.latitude, place.longitude);
  };

  // ── Sectioned result grouping ────────────────────────────────────────────────
  //
  // Rules:
  //   - "Nearby" label is ONLY used when a real origin (mapCenter or device geo) is known
  //     AND the result is within NEARBY_RADIUS_KM (60 miles). Never applied blindly.
  //   - When no origin is known, all results are returned as a flat list labeled "Results".
  //   - Deduplication by provider id prevents the same place appearing twice.
  //   - Nearby entries are sorted distance-ascending (closest first), then by the
  //     pre-existing text/geo rank for ties.
  //
  // Returns:
  //   nearby    — { place, km }[] within 60 mi (empty when no origin or global mode)
  //   other     — { place, km }[] beyond 60 mi, or all results when no origin
  //   hasCenter — whether a geographic origin is available
  //
  const groupResults = () => {
    const center    = getEffectiveCenter();
    const hasCenter = !!center;

    // Deduplicate by provider id — geocoders sometimes return the same POI under
    // multiple result types; fall back to coordinate string for id-less entries.
    const seen   = new Set();
    const deduped = results.filter((p) => {
      const key = p.id ?? `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!hasCenter || searchMode !== "local-biased") {
      // No origin available — cannot make truthful proximity claims.
      // Return everything as a flat "other" list; the footer will not say "Nearby".
      return {
        nearby:    [],
        other:     deduped.map((place) => ({ place, km: null })),
        hasCenter: false,
      };
    }

    const nearbyEntries = [];
    const otherEntries  = [];

    deduped.forEach((place) => {
      const km = haversineKm(
        center.latitude, center.longitude,
        place.latitude,  place.longitude,
      );
      (km <= NEARBY_RADIUS_KM ? nearbyEntries : otherEntries).push({ place, km });
    });

    // Sort nearby: closest first. The reranker's text/recency order is the tiebreaker
    // (array is already in ranked order so stable sort preserves it within equal distances).
    nearbyEntries.sort((a, b) => a.km - b.km);

    return { nearby: nearbyEntries, other: otherEntries, hasCenter: true };
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
            className="flex-shrink-0 w-11 h-11 md:w-6 md:h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-150"
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
  const { nearby, other, hasCenter } = groupResults();
  const showRecents  = isFocused && !query && recents.length > 0;
  const dropdownOpen = (isOpen || showRecents) && dropdownPos;

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
          placeholder={searchPlaceholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
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

      {/* "Search this area" hint — shown below input when map has drifted */}
      <AnimatePresence>
        {showSearchArea && !isLoading && (
          <motion.div
            key="search-area"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2 flex items-center gap-2"
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSearchThisArea}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150"
              style={{
                background: "rgba(220,46,115,0.1)",
                boxShadow:  "0 0 0 1px rgba(220,46,115,0.2)",
                color:      "#DC2E73",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,46,115,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,46,115,0.1)")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
              </svg>
              Search this area
            </button>
            <span style={{ fontSize: 10, color: "rgba(229,226,225,0.2)" }}>
              Map has moved
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline status messages */}
      {!isLoading && !fetchError && !noResults && query.length > 0 && query.length < MIN_CHARS && (
        <p className="text-[11px] mt-1.5 ml-1" style={{ color: "rgba(229,226,225,0.25)" }}>
          Keep typing to search…
        </p>
      )}
      {fetchError && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>{fetchError}</p>
      )}
      {error && !isOpen && !noResults && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>{error}</p>
      )}

      {/* ── Dropdown — portalled into Dialog.Content (outside card) ────────────
       *
       * Portal target: #location-dropdown-portal — a fixed-inset div sitting
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
          {dropdownOpen && (
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
                maxHeight:    320,
                overflowY:    "auto",
                borderRadius: "0.875rem",
                background:   "rgba(18,18,18,0.98)",
                backdropFilter:       "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow:    "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
                scrollbarWidth: "none",
                pointerEvents:  "auto",
              }}
            >
              {/* ── Recent venues (shown when focused + empty query) ── */}
              {showRecents && (
                <>
                  <SectionHeader label="Recent" />
                  {recents.map((place, i) => (
                    <ResultRow
                      key={place.id ?? `recent-${i}`}
                      place={place}
                      distanceKm={distanceFromCenter(place)}
                      isLast={i === recents.length - 1}
                      onSelect={handleSelect}
                      tag="recent"
                    />
                  ))}
                </>
              )}

              {/* ── Search results ── */}
              {isOpen && !showRecents && (
                <>
                  {/* No results at all */}
                  {noResults && !isLoading && (
                    <NoResultsState
                      query={query}
                      searchMode={searchMode}
                      onSwitchMode={() => switchMode("global")}
                      onCustomLocation={onCustomLocation}
                    />
                  )}

                  {/* ── Local-biased mode with a known origin ── */}
                  {!noResults && hasCenter && (
                    <>
                      {/* Nearby section — hard-filtered to 60 miles */}
                      <SectionHeader label="Nearby" />
                      {nearby.length === 0 ? (
                        <NoNearbyState
                          searchMode={searchMode}
                          onSwitchMode={() => switchMode("global")}
                        />
                      ) : (
                        nearby.map(({ place, km }, i) => (
                          <ResultRow
                            key={place.id ?? `n-${i}`}
                            place={place}
                            distanceKm={km}
                            isLast={i === nearby.length - 1 && other.length === 0}
                            onSelect={handleSelect}
                          />
                        ))
                      )}

                      {/* Broader matches — everything beyond 60 miles */}
                      {other.length > 0 && (
                        <>
                          <SectionHeader label="Broader matches" />
                          {other.map(({ place, km }, i) => (
                            <ResultRow
                              key={place.id ?? `o-${i}`}
                              place={place}
                              distanceKm={km}
                              isLast={i === other.length - 1}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {/* ── Global mode or no origin — flat list, no proximity claims ── */}
                  {!noResults && !hasCenter && (
                    other.map(({ place, km }, i) => (
                      <ResultRow
                        key={place.id ?? `f-${i}`}
                        place={place}
                        distanceKm={km}
                        isLast={i === other.length - 1}
                        onSelect={handleSelect}
                      />
                    ))
                  )}
                </>
              )}

              {/* ── Footer ── */}
              {isOpen && !showRecents && (
                <DropdownFooter
                  searchMode={searchMode}
                  hasCenter={hasCenter}
                  onSwitchMode={switchMode}
                  showSearchArea={showSearchArea}
                  onSearchArea={handleSearchThisArea}
                  onCustomLocation={onCustomLocation}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById(portalId) ?? document.body,
      )}
    </div>
  );
};

// ─── Sub-components (file-local, not exported) ────────────────────────────────

const SectionHeader = ({ label }) => (
  <div
    style={{
      padding:    "6px 16px 3px",
      borderTop:  "1px solid rgba(255,255,255,0.05)",
    }}
  >
    <span
      style={{
        fontSize:      10,
        letterSpacing: "0.09em",
        fontWeight:    600,
        textTransform: "uppercase",
        color:         "rgba(229,226,225,0.22)",
      }}
    >
      {label}
    </span>
  </div>
);

const ResultRow = ({ place, distanceKm, isLast, onSelect, tag }) => {
  const { primaryLabel, secondaryLabel } = formatSelectedLocationDisplay(place);
  const distLabel = formatDistanceMiles(distanceKm);

  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="w-full text-left px-4 py-3 flex items-start gap-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        transition:   "background 0.1s",
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
            color:        "rgba(229,226,225,0.92)",
            overflow:     "hidden",
            whiteSpace:   "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {primaryLabel}
        </p>
        <p
          className="text-[11px] mt-0.5 leading-snug"
          style={{
            color:        "rgba(229,226,225,0.35)",
            overflow:     "hidden",
            whiteSpace:   "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {secondaryLabel}
        </p>
      </div>

      {/* Right-side metadata: distance or recency tag */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5 ml-1 mt-[2px]">
        {distLabel && (
          <span
            style={{
              fontSize:      10,
              color:         "rgba(229,226,225,0.25)",
              whiteSpace:    "nowrap",
              letterSpacing: "0.02em",
            }}
          >
            {distLabel}
          </span>
        )}
        {tag === "recent" && (
          <span
            style={{
              fontSize:      9,
              color:         "rgba(220,46,115,0.5)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight:    600,
            }}
          >
            recent
          </span>
        )}
      </div>
    </button>
  );
};

// Shown inside the "Nearby" section when no results are within 60 miles.
const NoNearbyState = ({ searchMode, onSwitchMode }) => (
  <div style={{ padding: "10px 16px 8px" }}>
    <p style={{ fontSize: 12, color: "rgba(229,226,225,0.38)", lineHeight: 1.5 }}>
      No matches within 60 miles.
      {searchMode === "local-biased" && (
        <>
          {" "}Check{" "}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSwitchMode}
            style={{
              color:      "rgba(220,46,115,0.7)",
              background: "none",
              border:     "none",
              padding:    0,
              fontSize:   12,
              cursor:     "pointer",
            }}
          >
            Broader matches
          </button>
          {" "}below.
        </>
      )}
    </p>
  </div>
);

// Shown when the search returned zero results entirely.
const NoResultsState = ({ query, searchMode, onSwitchMode, onCustomLocation }) => (
  <div style={{ padding: "16px 16px 12px" }}>
    <p
      style={{
        fontSize:     13,
        color:        "rgba(229,226,225,0.55)",
        marginBottom: 6,
        fontWeight:   500,
      }}
    >
      No venues found
      {query
        ? <> for <em style={{ fontStyle: "normal", color: "rgba(229,226,225,0.75)" }}>"{query}"</em></>
        : null}
    </p>
    <p style={{ fontSize: 11, color: "rgba(229,226,225,0.28)", lineHeight: 1.6 }}>
      Try adjusting the name or spelling.
      {searchMode === "local-biased" && (
        <>
          {" "}To broaden the search,{" "}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSwitchMode}
            style={{
              color:      "rgba(220,46,115,0.75)",
              background: "none",
              border:     "none",
              padding:    0,
              fontSize:   11,
              cursor:     "pointer",
            }}
          >
            show all areas
          </button>
          .
        </>
      )}
    </p>
    {onCustomLocation && (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCustomLocation}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          6,
          marginTop:    10,
          padding:      "7px 12px",
          borderRadius: "0.6rem",
          background:   "rgba(220,46,115,0.1)",
          boxShadow:    "0 0 0 1px rgba(220,46,115,0.2)",
          color:        "#DC2E73",
          fontSize:     12,
          fontWeight:   500,
          border:       "none",
          cursor:       "pointer",
          width:        "100%",
          textAlign:    "left",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,46,115,0.16)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,46,115,0.1)")}
      >
        <span style={{ fontSize: 13 }}>✏️</span>
        Enter location manually instead
      </button>
    )}
  </div>
);

const DropdownFooter = ({ searchMode, hasCenter, onSwitchMode, showSearchArea, onSearchArea, onCustomLocation }) => {
  // Only claim "Nearby results" when we actually have an origin to measure from.
  // Without one, the section label is omitted and we call it "Results" here.
  const modeLabel =
    searchMode === "global"                 ? "All results"     :
    hasCenter                               ? "Nearby results"  :
                                              "Results";

  return (
    <div
      style={{
        borderTop:  "1px solid rgba(255,255,255,0.05)",
        padding:    "7px 16px",
        display:    "flex",
        alignItems: "center",
        flexWrap:   "wrap",
        gap:        5,
      }}
    >
      <span style={{ fontSize: 11, color: "rgba(229,226,225,0.28)" }}>
        {modeLabel}
      </span>
      <span style={{ fontSize: 11, color: "rgba(229,226,225,0.16)" }}>·</span>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSwitchMode(searchMode === "local-biased" ? "global" : "local-biased")}
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

      {showSearchArea && (
        <>
          <span style={{ fontSize: 11, color: "rgba(229,226,225,0.16)" }}>·</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSearchArea}
            style={{
              fontSize:   11,
              color:      "rgba(220,46,115,0.75)",
              background: "none",
              border:     "none",
              padding:    0,
              cursor:     "pointer",
            }}
          >
            Search this area
          </button>
        </>
      )}

      {onCustomLocation && (
        <>
          <span style={{ fontSize: 11, color: "rgba(229,226,225,0.16)" }}>·</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onCustomLocation}
            style={{
              fontSize:   11,
              color:      "rgba(220,46,115,0.6)",
              background: "none",
              border:     "none",
              padding:    0,
              cursor:     "pointer",
            }}
          >
            Enter manually
          </button>
        </>
      )}
    </div>
  );
};

export default MapLocationSearchInput;
