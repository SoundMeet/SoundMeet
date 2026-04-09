import { getCapacityState } from "../../utils/eventComputed";

/**
 * EventAttendanceSection — attendee count, capacity bar, avatar row.
 * Renders nothing if there's no meaningful attendance data.
 */
const EventAttendanceSection = ({ item, accent }) => {
  const count = item?.attendeeCount != null ? Number(item.attendeeCount) : null;
  const cap = item?.capacity != null ? Number(item.capacity) : null;
  const capacityState = getCapacityState(item);

  // Nothing to show if no count and no capacity
  if (count === null && cap === null) return null;

  const fillPercent = cap ? Math.min(100, Math.round((count / cap) * 100)) : null;

  const fillColor =
    capacityState.state === "full"
      ? "#FB4040"
      : capacityState.state === "almost_full"
      ? "#F7C10D"
      : accent;

  // Mock avatar placeholders (real avatars not available yet)
  const avatarCount = Math.min(count ?? 0, 4);

  return (
    <div className="px-7 pb-3">
      <div
        className="rounded-2xl px-4 py-2.5 space-y-2.5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Count + capacity label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Placeholder avatar stack */}
            {avatarCount > 0 && (
              <div className="flex -space-x-2">
                {Array.from({ length: avatarCount }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center text-[8px] font-bold text-neutral-400"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
            )}

            <div>
              <span className="text-sm font-semibold text-white">
                {count != null ? count : "—"}
              </span>
              {cap != null && (
                <span className="text-sm text-neutral-500"> / {cap}</span>
              )}
              <span className="text-xs text-neutral-500 ml-1">going</span>
            </div>
          </div>

          {/* Spots label */}
          {capacityState.label && (
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{
                color:
                  capacityState.state === "full"
                    ? "#FB4040"
                    : capacityState.state === "almost_full"
                    ? "#F7C10D"
                    : "rgba(229,226,225,0.45)",
              }}
            >
              {capacityState.label}
            </span>
          )}
        </div>

        {/* Capacity bar */}
        {fillPercent !== null && (
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${fillPercent}%`,
                background: fillColor,
              }}
            />
          </div>
        )}

        {/* Integration point: replace with real friends data when available */}
      </div>
    </div>
  );
};

export default EventAttendanceSection;
