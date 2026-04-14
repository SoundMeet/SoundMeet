import { useState, useRef, useEffect } from "react";

const ARTIST_INITIAL = 20;
const MAX_PIPS       = 8;

// Search icon
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

// Close / clear icon
function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
         aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

// Checkmark icon for artist selection badge
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
         stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// Skeleton loaders
function PillSkeletons() {
  const widths = [72, 90, 60, 108, 80, 64, 96, 76, 88, 68, 102, 78];
  return (
    <div className="ob-skeleton-grid">
      {widths.map((w, i) => (
        <div key={i} className="ob-skeleton-pill" style={{ width: w, animationDelay: `${i * 0.06}s` }} />
      ))}
    </div>
  );
}
function ArtistSkeletons() {
  return (
    <div className="ob-skeleton-artist-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="ob-skeleton-artist" style={{ animationDelay: `${i * 0.04}s` }}>
          <div className="ob-skeleton-circle" />
          <div className="ob-skeleton-name" />
        </div>
      ))}
    </div>
  );
}

// ─── SelectionStep ────────────────────────────────────────────────────────────
// Handles both pill (type='pills') and artist grid (type='artists') steps.
// config  — the step definition from STEPS
// items   — array of { id, name, picture? }
// loading — true while options are being fetched
// selected — array of selected items
// onToggle — fn(item) called on tap
export default function SelectionStep({ config, items, loading, selected, onToggle }) {
  const [search, setSearch]   = useState("");
  const [showAll, setShowAll] = useState(false);
  const searchRef             = useRef(null);
  const isArtists             = config.type === "artists";
  const count                 = selected.length;

  // Reset search & showAll when step changes
  useEffect(() => {
    setSearch("");
    setShowAll(false);
  }, [config.id]);

  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const visible = isArtists && !search && !showAll
    ? filtered.slice(0, ARTIST_INITIAL)
    : filtered;

  const hasMore = isArtists && !search && !showAll && filtered.length > ARTIST_INITIAL;

  const clearSearch = () => {
    setSearch("");
    searchRef.current?.focus();
  };

  return (
    <div>
      {/* Step header: headline + live pick count */}
      <div className="ob-step-header">
        <h2 className={`ob-headline ob-headline-xl`}>{config.headline}</h2>
        {count > 0 && (
          <span className="ob-pick-count" aria-live="polite">{count} picked</span>
        )}
      </div>
      <p className="ob-sub">{config.sub}</p>

      {/* Selection pips — only when ≥ 1 picked */}
      {count > 0 && (
        <div className="ob-count-track" aria-hidden="true">
          {Array.from({ length: Math.min(count, MAX_PIPS) }).map((_, i) => (
            <div key={i} className="ob-count-pip" style={{ animationDelay: `${i * 0.03}s` }} />
          ))}
        </div>
      )}

      {/* Search */}
      <div className="ob-search-wrap">
        <span className="ob-search-icon"><SearchIcon /></span>
        <input
          ref={searchRef}
          className="ob-search"
          type="search"
          inputMode="search"
          placeholder={config.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Escape" && clearSearch()}
          aria-label={config.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
        />
        {search && (
          <button className="ob-search-clear" onClick={clearSearch} aria-label="Clear search">
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (isArtists ? <ArtistSkeletons /> : <PillSkeletons />)}

      {/* Empty search result */}
      {!loading && filtered.length === 0 && (
        <p className="ob-empty">No results for "{search}"</p>
      )}

      {/* Pill grid */}
      {!loading && !isArtists && filtered.length > 0 && (
        <div className="ob-pill-grid" role="group" aria-label={config.headline}>
          {filtered.map((item, i) => {
            const isSel = selected.some(s => s.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`ob-pill${isSel ? " sel" : ""}`}
                style={{ animationDelay: `${Math.min(i, 20) * 0.018}s` }}
                onClick={() => onToggle(item)}
                aria-pressed={isSel}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Artist grid */}
      {!loading && isArtists && filtered.length > 0 && (
        <>
          <div className="ob-artist-grid" role="group" aria-label="Artist influences">
            {visible.map((item, i) => {
              const isSel = selected.some(s => s.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`ob-artist${isSel ? " sel" : ""}`}
                  style={{ animationDelay: `${Math.min(i, 20) * 0.014}s` }}
                  onClick={() => onToggle(item)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle(item)}
                >
                  <div className="ob-artist-img">
                    {item.picture
                      ? <img src={item.picture} alt={item.name} loading="lazy" />
                      : <div className="ob-artist-placeholder">♪</div>
                    }
                    {isSel && (
                      <div className="ob-artist-check">
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                  <span className="ob-artist-name">{item.name}</span>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              className="ob-btn-back"
              style={{ textAlign: "left", paddingLeft: 0, paddingTop: 10 }}
              onClick={() => setShowAll(true)}
            >
              Show all {filtered.length} artists
            </button>
          )}
        </>
      )}
    </div>
  );
}
