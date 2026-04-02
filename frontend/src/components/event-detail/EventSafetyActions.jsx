/**
 * EventSafetyActions — subtle footer links: Report, last updated, privacy info.
 */

const FlagIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const EventSafetyActions = ({ item }) => {
  const updatedAt = item?.updatedAt ?? null;

  return (
    <div className="px-7 py-4 flex items-center justify-between">
      <button
        className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors duration-150"
        onClick={() => {
          /* TODO: open report flow when moderation backend is ready */
        }}
      >
        <FlagIcon />
        Report
      </button>

      {updatedAt && (
        <span className="text-[11px] text-neutral-700">
          Updated {updatedAt}
        </span>
      )}
    </div>
  );
};

export default EventSafetyActions;
