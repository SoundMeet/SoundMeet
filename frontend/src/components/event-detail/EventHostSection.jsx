import { hexToRgba } from "../../utils/discovery";
import { extractHostDisplay, nameToInitials } from "../../utils/eventComputed";

/**
 * EventHostSection — host/organizer identity block.
 * Shown below logistics, before admin actions.
 */
const EventHostSection = ({ item, accent, relationship }) => {
  const hostName = extractHostDisplay(item);
  if (!hostName) return null;

  const initials = item.initials ?? nameToInitials(hostName);
  const isYou = relationship === "creator" || relationship === "admin";

  // Determine a role label based on event type
  const roleLabel =
    item.type === "jam"
      ? "Host"
      : item.type === "promote_show"
      ? "Organizer"
      : item.type === "find_bandmate"
      ? "Band"
      : item.type === "join_band"
      ? "Musician"
      : "Host";

  return (
    <div className="px-7 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-3">
        {roleLabel}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{
            background: hexToRgba(accent, 0.14),
            color: accent,
            border: `1px solid ${hexToRgba(accent, 0.2)}`,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {isYou ? `${hostName} (you)` : hostName}
          </p>
          {/* Placeholder for host bio / link when profile data is available */}
          {/* TODO: link to profile page when user profiles are available */}
        </div>
      </div>
    </div>
  );
};

export default EventHostSection;
