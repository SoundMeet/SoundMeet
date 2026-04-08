import { hexToRgba } from "../../utils/discovery";
import { extractHostDisplay, nameToInitials } from "../../utils/eventComputed";

/** Shared row layout: icon + text */
const MetaRow = ({ icon, children }) => (
  <div className="flex items-start gap-2.5">
    <span className="shrink-0 mt-0.5 text-neutral-500">{icon}</span>
    <span className="text-sm text-neutral-300 leading-snug">{children}</span>
  </div>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/**
 * EventIdentitySection — host, datetime, location display.
 *
 * Props:
 *   item            - discovery item
 *   accent          - hex accent colour string
 *   canSeeLocation  - boolean (from eventComputed.canRevealExactLocation)
 */
const EventIdentitySection = ({ item, accent, canSeeLocation }) => {
  const hostName = extractHostDisplay(item);
  const initials = item.initials ?? nameToInitials(hostName);

  const dateTime = item.dateTime ?? item.date ?? item.metaSecondary ?? null;
  const neighborhood = item.neighborhood ?? item.subtitle ?? null;
  const distance = item.distanceMiles != null ? `${Number(item.distanceMiles).toFixed(1)} mi away` : null;

  const locationLine = [
    canSeeLocation ? (item.venueName ?? neighborhood) : neighborhood,
    distance,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="px-7 py-5">
      <div className="flex items-start gap-4">
        {/* Host avatar */}
        {hostName && (
          <div
            className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-[13px] font-bold"
            style={{
              background: hexToRgba(accent, 0.15),
              color: accent,
              border: `1px solid ${hexToRgba(accent, 0.22)}`,
            }}
          >
            {initials}
          </div>
        )}

        {/* Meta rows */}
        <div className="flex-1 min-w-0 space-y-2">
          {hostName && (
            <p className="text-sm font-semibold text-white leading-none">{hostName}</p>
          )}

          {dateTime && (
            <MetaRow icon={<ClockIcon />}>{dateTime}</MetaRow>
          )}

          {locationLine && (
            <MetaRow icon={canSeeLocation ? <PinIcon /> : <LockIcon />}>
              <span className={canSeeLocation ? "" : "text-neutral-500 italic"}>
                {locationLine}
                {!canSeeLocation && item.isPrivate && (
                  <span className="ml-1.5 text-[11px] text-neutral-600 not-italic">(hidden)</span>
                )}
              </span>
            </MetaRow>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventIdentitySection;
