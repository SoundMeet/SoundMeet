import { getLocationNotice } from "../../utils/eventComputed";

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/**
 * EventPermissionsNotice — privacy notice shown when exact location is hidden.
 * Returns null if location is visible to the viewer.
 */
const EventPermissionsNotice = ({ item, viewerContext }) => {
  const notice = getLocationNotice(item, viewerContext);
  if (!notice) return null;

  return (
    <div className="px-7 pb-4">
      <div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="shrink-0 mt-0.5 text-neutral-500">
          <LockIcon />
        </span>
        <p className="text-[12px] text-neutral-500 leading-relaxed">{notice}</p>
      </div>
    </div>
  );
};

export default EventPermissionsNotice;
