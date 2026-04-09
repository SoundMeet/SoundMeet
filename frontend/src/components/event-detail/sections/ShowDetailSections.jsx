/**
 * ShowDetailSections — show-specific content sections.
 * Rendered inside EventDetailModal for type === 'promote_show'.
 *
 * Structural sibling to JamDetailSections — same primitives, same rhythm.
 *
 * Section order (each hidden when empty):
 *   1. Details       — end time, duration, capacity, ticket price
 *   2. Genres        — accent-highlighted chips
 *   3. Lineup        — performers with optional role badges
 *   4. Directions    — free-text location guide
 *   5. Tickets       — link row when a ticket URL exists
 */

import { hexToRgba } from "../../../utils/discovery";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDuration(startRaw, endRaw) {
  if (!startRaw || !endRaw) return null;
  const diffMs = new Date(endRaw) - new Date(startRaw);
  if (diffMs <= 0) return null;
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTicketPrice(price) {
  if (price == null || Number(price) === 0) return null;
  const n = Number(price);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function stripProtocol(url) {
  return url.replace(/^https?:\/\//, "").split("/")[0];
}

// ─── Primitives (same as JamDetailSections) ───────────────────────────────────

const SectionDivider = () => (
  <div className="mx-7 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2">
    {children}
  </p>
);

const SubLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-1">
    {children}
  </p>
);

const DetailItem = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-neutral-300">{value}</p>
    </div>
  );
};

const Chip = ({ label, accent, highlight }) => (
  <span
    className="h-6 px-2.5 flex items-center rounded-xl text-xs font-medium whitespace-nowrap"
    style={
      highlight && accent
        ? {
            color: accent,
            background: hexToRgba(accent, 0.1),
            border: `1px solid ${hexToRgba(accent, 0.2)}`,
          }
        : {
            color: "rgba(229,226,225,0.65)",
            border: "1px solid rgba(255,255,255,0.09)",
          }
    }
  >
    {label}
  </span>
);

const ChipGroup = ({ label, items, accent, highlight = false }) => {
  if (!items?.length) return null;
  return (
    <div>
      {label && <SubLabel>{label}</SubLabel>}
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Chip key={item} label={item} accent={accent} highlight={highlight} />
        ))}
      </div>
    </div>
  );
};

// ─── ShowDetailSections ───────────────────────────────────────────────────────

const ShowDetailSections = ({ item, accent }) => {
  // ── 1. Details ──────────────────────────────────────────────────────────────
  const endDateTime = item?.endDateTime ?? null;
  const duration    = computeDuration(item?.dateTimeRaw, item?.endDateTimeRaw);
  const capacity    = item?.capacity != null ? `Up to ${item.capacity}` : null;
  const ticketPrice = formatTicketPrice(item?.ticketPrice);

  const detailEntries = [
    { label: "Ends",         value: endDateTime },
    { label: "Duration",     value: duration    },
    { label: "Capacity",     value: capacity    },
    { label: "Ticket price", value: ticketPrice },
  ].filter((e) => e.value);

  const hasDetails = detailEntries.length > 0;

  // ── 2. Genres ───────────────────────────────────────────────────────────────
  const genres    = item?.genres ?? [];
  const hasGenres = genres.length > 0;

  // ── 3. Lineup ───────────────────────────────────────────────────────────────
  const lineup    = Array.isArray(item?.lineup) ? item.lineup : [];
  const hasLineup = lineup.length > 0;

  // ── 4. Directions ───────────────────────────────────────────────────────────
  const locationGuide = item?.locationGuide ?? null;

  // ── 5. Ticket link ──────────────────────────────────────────────────────────
  const ticketLink = item?.ticketLink ?? null;

  if (!hasDetails && !hasGenres && !hasLineup && !locationGuide && !ticketLink) {
    return null;
  }

  return (
    <>
      {/* ── 1. Details ───────────────────────────────────────────────────── */}
      {hasDetails && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <SectionLabel>Details</SectionLabel>
            {detailEntries.length === 1 ? (
              <DetailItem label={detailEntries[0].label} value={detailEntries[0].value} />
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {detailEntries.map((e) => (
                  <DetailItem key={e.label} label={e.label} value={e.value} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 2. Genres ────────────────────────────────────────────────────── */}
      {hasGenres && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <ChipGroup items={genres} accent={accent} highlight />
          </div>
        </>
      )}

      {/* ── 3. Lineup ────────────────────────────────────────────────────── */}
      {hasLineup && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <SectionLabel>Lineup</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {lineup.map((act, i) => (
                <span
                  key={act.id ?? i}
                  className="inline-flex items-center gap-2 h-7 pl-3 pr-3 rounded-xl text-[12px] font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(229,226,225,0.85)",
                  }}
                >
                  {act.name}
                  {act.role && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: accent }}
                    >
                      {act.role}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── 4. Directions ────────────────────────────────────────────────── */}
      {locationGuide && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <SectionLabel>Directions</SectionLabel>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {locationGuide}
            </p>
          </div>
        </>
      )}

      {/* ── 5. Tickets ───────────────────────────────────────────────────── */}
      {ticketLink && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <a
              href={ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              {/* Icon */}
              <div
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl"
                style={{
                  background: accent ? hexToRgba(accent, 0.1) : "rgba(255,255,255,0.06)",
                  border: `1px solid ${accent ? hexToRgba(accent, 0.18) : "rgba(255,255,255,0.09)"}`,
                }}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={accent ?? "rgba(229,226,225,0.6)"} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                </svg>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors duration-150">
                  {ticketPrice ? `Get Tickets · ${ticketPrice}` : "Get Tickets"}
                </p>
                <p className="text-[11px] text-neutral-600 truncate">
                  {stripProtocol(ticketLink)}
                </p>
              </div>

              {/* External link arrow */}
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="rgba(229,226,225,0.2)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0 group-hover:stroke-neutral-500 transition-colors duration-150"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </>
      )}
    </>
  );
};

export default ShowDetailSections;
