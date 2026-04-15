import DiscoverToolbar from "./DiscoverToolbar";
import DiscoverSearchBar from "./DiscoverSearchBar";
import { DISCOVERY_CATEGORY_PILLS } from "../../utils/discovery";
import { countActiveMoreFilters } from "../../utils/discoverFilters";

/**
 * CategoryChip — desktop chip. Sizing kept at desktop spec; do not modify.
 */
const CategoryChip = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-3 py-[5px] rounded-full text-[11.5px] font-medium border transition-all duration-200 ${
      isActive
        ? "bg-[#DC2E73] border-[#DC2E73] text-white shadow-[0_0_10px_rgba(220,46,115,0.55)]"
        : "bg-neutral-800/70 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white"
    }`}
  >
    {label}
  </button>
);

/**
 * MobileChip — slimmer chip variant for the mobile horizontal pill row only.
 * Isolated here so CategoryChip (desktop) is never touched.
 */
const MobileChip = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-2.5 py-[4px] rounded-full text-[11px] font-medium border transition-all duration-200 ${
      isActive
        ? "bg-[#DC2E73] border-[#DC2E73] text-white shadow-[0_0_8px_rgba(220,46,115,0.35)]"
        : "bg-neutral-800/70 border-white/[0.06] text-neutral-400"
    }`}
  >
    {label}
  </button>
);

/**
 * DiscoverControls — unified top filter + search bar for the Discover page.
 *
 * Desktop layout (≥ md):
 *   Row 1: search input + multi-select category chips (golden-ratio width)
 *   Row 2: radius, time, more filters (utility controls)
 *
 * Mobile layout (< md):
 *   Row 1: search bar only (full-width pill)
 *   Row 2: category chips — single horizontal scroll line (never wraps)
 *   Toolbar controls hidden → replaced by a single "Filters" pill
 *
 * Category model:
 *   activeCategories = [] means "All" is active (no restriction).
 *   Clicking a chip toggles it; multiple chips can be active at once.
 *   Clicking "All" clears the selection.
 */
const DiscoverControls = ({
  activeCategories,
  onCategoryToggle,
  searchQuery,
  onSearchQueryChange,
  onSearchResultSelect,
  allItems,
  radius,
  onRadiusChange,
  onRadiusOpenChange,
  time,
  onTimeChange,
  moreFilters,
  onMoreFiltersChange,
  onMobileFiltersOpen,
}) => {
  const isAllActive = activeCategories.length === 0;
  const mobileFilterCount = countActiveMoreFilters(moreFilters);
  // Count radius + time as active when non-default, plus moreFilters count
  const totalMobileFilterCount =
    mobileFilterCount +
    (radius !== 25 ? 1 : 0) +
    (time !== "Any Time" ? 1 : 0);

  return (
    <div className="px-3 pt-2.5 pb-2 md:px-6 md:pt-5 md:pb-2 pointer-events-auto flex flex-col gap-2 md:gap-1.5 relative z-[200]">

      {/* ── Desktop Row 1: Search + category chips ──────────────────────────── */}
      {/*
          Golden ratio: the search bar (min-w-[300px]) makes this row noticeably
          wider than Row 2 (toolbar ~320–380px). Row 1 naturally reaches ~700px+,
          roughly 1.618× Row 2. The search bar is the dominant visual element.
          overflow-visible so the dropdown can extend below the pill container.
      */}
      <div className="hidden md:flex flex-wrap items-center gap-x-2.5 gap-y-2
                      bg-neutral-900/55 backdrop-blur-2xl rounded-[2rem]
                      px-3 py-2
                      border border-white/[0.09]
                      shadow-[0_0_10px_rgba(220,46,115,0.22)]
                      w-fit max-w-full overflow-visible relative z-[100]">

        {/* Search input with live dropdown */}
        <DiscoverSearchBar
          value={searchQuery}
          onChange={onSearchQueryChange}
          onResultSelect={onSearchResultSelect}
          allItems={allItems}
        />

        {/* Vertical divider */}
        <div className="w-px h-4 bg-white/[0.08] shrink-0" />

        {/* Category chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <CategoryChip
            label="All"
            isActive={isAllActive}
            onClick={() => onCategoryToggle("all")}
          />
          {DISCOVERY_CATEGORY_PILLS.filter((p) => p.id !== "all").map((pill) => (
            <CategoryChip
              key={pill.id}
              label={pill.label}
              isActive={activeCategories.includes(pill.id)}
              onClick={() => onCategoryToggle(pill.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile: Unified frosted-glass control panel ─────────────────────── */}
      <div className="md:hidden bg-neutral-900/55 backdrop-blur-xl rounded-2xl px-3 pt-2.5 pb-2.5
                      border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.28)]
                      flex flex-col gap-2 overflow-visible">

        {/* Row 1: Search bar + filter button */}
        <div className="flex items-center gap-1.5 relative z-[100]">
          <div className="flex-1 min-w-0 overflow-visible">
            <DiscoverSearchBar
              value={searchQuery}
              onChange={onSearchQueryChange}
              onResultSelect={onSearchResultSelect}
              allItems={allItems}
            />
          </div>

          {/* Filter icon button */}
          <div className="relative shrink-0">
            <button
              onClick={onMobileFiltersOpen}
              aria-label={totalMobileFilterCount > 0 ? `Filters (${totalMobileFilterCount} active)` : "Filters"}
              className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-200 ${
                totalMobileFilterCount > 0
                  ? "bg-[#DC2E73]/15 border-[#DC2E73]/40 text-[#f07aaa] shadow-[0_0_10px_rgba(220,46,115,0.2)]"
                  : "bg-neutral-800/65 border-white/[0.09] text-neutral-400"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 6h16M8 12h8M11 18h2" />
              </svg>
            </button>
            {totalMobileFilterCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold leading-none pointer-events-none select-none"
                style={{ background: '#DC2E73', color: '#fff' }}
              >
                {totalMobileFilterCount}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Category chips — horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MobileChip
            label="All"
            isActive={isAllActive}
            onClick={() => onCategoryToggle("all")}
          />
          {DISCOVERY_CATEGORY_PILLS.filter((p) => p.id !== "all").map((pill) => (
            <MobileChip
              key={pill.id}
              label={pill.label}
              isActive={activeCategories.includes(pill.id)}
              onClick={() => onCategoryToggle(pill.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop Row 2: Utility controls (kept compact) ──────────────────── */}
      <div className="hidden md:block">
        <DiscoverToolbar
          radius={radius}
          onRadiusChange={onRadiusChange}
          onRadiusOpenChange={onRadiusOpenChange}
          time={time}
          onTimeChange={onTimeChange}
          moreFilters={moreFilters}
          onMoreFiltersChange={onMoreFiltersChange}
        />
      </div>

    </div>
  );
};

export default DiscoverControls;
