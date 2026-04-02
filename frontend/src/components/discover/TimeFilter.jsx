import { TIME_OPTIONS } from "../../utils/discoverFilters";

/**
 * TimeFilter — row of compact pill buttons for time-based filtering.
 *
 * Props:
 *   value    {string}   - Currently active time option
 *   onChange {function} - Called with the selected time string
 */
const TimeFilter = ({ value, onChange }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {TIME_OPTIONS.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 shrink-0
          ${value === opt
            ? "bg-pink-600 border-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.55),0_0_20px_rgba(236,72,153,0.2)]"
            : "bg-neutral-900/70 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
          }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

export default TimeFilter;
