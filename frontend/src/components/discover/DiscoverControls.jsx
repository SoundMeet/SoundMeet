import DiscoverToolbar from "./DiscoverToolbar";
import DiscoverSearchBar from "./DiscoverSearchBar";
import { DISCOVERY_CATEGORY_PILLS } from "../../utils/discovery";

/**
 * CategoryChip — single chip in the top filter row.
 *
 * "All" is a special chip: active when activeCategories is empty,
 * and clicking it clears the selection.
 * Individual chips toggle independently; multiple can be active simultaneously.
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
 * DiscoverControls — unified top filter + search bar for the Discover page.
 *
 * Golden ratio layout:
 *   Row 1 (search + category chips) is visually ~1.618× wider than Row 2
 *   by giving the search bar substantial width as the primary emphasis.
 *
 * Row 1: search input + multi-select category chips
 * Row 2: radius, time, more filters (utility controls — kept compact)
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
}) => {
  const isAllActive = activeCategories.length === 0;

  return (
    <div className="px-6 pt-5 pb-2 pointer-events-auto flex flex-col gap-1.5">

      {/* ── Row 1: Search + category chips ─────────────────────────────────── */}
      {/*
          Golden ratio: the search bar (min-w-[300px]) makes this row noticeably
          wider than Row 2 (toolbar ~320–380px). Row 1 naturally reaches ~700px+,
          roughly 1.618× Row 2. The search bar is the dominant visual element.
          overflow-visible so the dropdown can extend below the pill container.
      */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2
                      bg-neutral-900/55 backdrop-blur-2xl rounded-[2rem]
                      px-3 py-2
                      border border-white/[0.09]
                      shadow-[0_0_10px_rgba(220,46,115,0.22)]
                      w-fit max-w-full">

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

      {/* ── Row 2: Utility controls (kept compact) ──────────────────────────── */}
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
  );
};

export default DiscoverControls;
