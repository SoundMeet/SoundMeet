import RadiusFilter from "./RadiusFilter";
import TimeFilter from "./TimeFilter";
import MoreFiltersPopover from "./MoreFiltersPopover";

/**
 * DiscoverToolbar — second row of utility controls below the main search bar.
 * Contains: RadiusFilter | divider | TimeFilter | divider | MoreFiltersPopover
 *
 * Props:
 *   radius              {number}   - Active radius in miles
 *   onRadiusChange      {function}
 *   onRadiusOpenChange  {function} - Called with boolean when radius dropdown opens/closes
 *   time                {string}   - Active time filter
 *   onTimeChange        {function}
 *   moreFilters         {object}   - Advanced filter state
 *   onMoreFiltersChange {function}
 */
const DiscoverToolbar = ({
  radius,
  onRadiusChange,
  onRadiusOpenChange,
  time,
  onTimeChange,
  moreFilters,
  onMoreFiltersChange,
}) => (
  <div className="flex items-center gap-2 flex-wrap relative z-[10]">
    <RadiusFilter value={radius} onChange={onRadiusChange} onOpenChange={onRadiusOpenChange} />
    <TimeFilter value={time} onChange={onTimeChange} />
    <MoreFiltersPopover value={moreFilters} onChange={onMoreFiltersChange} />
  </div>
);

export default DiscoverToolbar;
