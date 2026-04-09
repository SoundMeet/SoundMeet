import { extractHostDisplay } from "../../utils/eventComputed";

/** Shared row layout: icon + text */
const MetaRow = ({ icon, children }) => (
  <div className="flex items-start gap-2">
    <span className="shrink-0 mt-0.5 text-neutral-500">{icon}</span>
    <div className="text-sm text-neutral-300 leading-snug min-w-0">{children}</div>
  </div>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const PinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

/**
 * EventIdentitySection — compact date/time, location, and host meta rows.
 * Host avatar lives in EventHostSection; this is just the key facts row.
 *
 * Props:
 *   item            - discovery item
 *   accent          - hex accent colour string
 *   canSeeLocation  - boolean (from eventComputed.canRevealExactLocation)
 */
const EventIdentitySection = ({ item, canSeeLocation }) => {
  const hostName = extractHostDisplay(item);

  const dateTime = item.dateTime ?? item.date ?? item.metaSecondary ?? null;
  const distance = item.distanceMiles != null ? `${Number(item.distanceMiles).toFixed(1)} mi away` : null;

  const exactLocation =
    item.locationName ?? item.locationAddress ?? item.venueName ?? item.neighborhood ?? null;
  const approximateLocation = item.neighborhood ?? null;

  const displayLocation = canSeeLocation ? exactLocation : approximateLocation;
  const locationLine = [displayLocation, distance].filter(Boolean).join(" · ");

  const streetAddress = (() => {
    if (!canSeeLocation || !item.locationAddress) return null;
    const addr = item.locationAddress;
    const name = item.locationName;
    if (name && addr.startsWith(name + ", ")) return addr.slice(name.length + 2);
    if (name && addr === name) return null;
    return addr;
  })();

  const hasAnyMeta = !!(dateTime || locationLine || streetAddress || hostName);
  if (!hasAnyMeta) return null;

  return (
    <div className="px-7 pt-1 pb-3 space-y-1.5">
      {hostName && (
        <MetaRow icon={<PersonIcon />}>
          <span className="text-neutral-300">{hostName}</span>
        </MetaRow>
      )}

      {dateTime && (
        <MetaRow icon={<ClockIcon />}>{dateTime}</MetaRow>
      )}

      {(locationLine || streetAddress) && (
        <MetaRow icon={canSeeLocation ? <PinIcon /> : <LockIcon />}>
          <span className={canSeeLocation ? "" : "text-neutral-500 italic"}>
            {locationLine}
            {!canSeeLocation && item.isPrivate && (
              <span className="ml-1.5 text-[11px] text-neutral-600 not-italic">(hidden)</span>
            )}
          </span>
          {streetAddress && (
            <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{streetAddress}</p>
          )}
        </MetaRow>
      )}
    </div>
  );
};

export default EventIdentitySection;
