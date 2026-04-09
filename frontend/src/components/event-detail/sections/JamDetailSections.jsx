/**
 * JamDetailSections — jam-specific content sections.
 * Rendered inside EventDetailModal for type === 'jam'.
 *
 * Section order (each hidden when empty):
 *   1. Looking for      — instruments needed + roles  (most scannable, shown first)
 *   2. Primary details  — adaptive grid/single-col based on data density
 *   3. Genres + Vibes   — side-by-side when both exist, full-width when one side only
 *   4. Location guide   — free-text wayfinding note
 *   5. Gear             — gear provided + gear needed
 */

import { hexToRgba } from "../../../utils/discovery";
import { getCapacityState } from "../../../utils/eventComputed";

// ─── Static label maps ────────────────────────────────────────────────────────

const JAM_TYPE_LABELS = {
  "open-jam":      "Open Jam",
  "band-practice": "Band Practice",
  "songwriting":   "Songwriting Session",
  "recording":     "Recording Session",
  "performance":   "Live Performance",
  "workshop":      "Workshop",
};

const SKILL_LEVEL_LABELS = {
  "beginner":     "Beginner",
  "intermediate": "Intermediate",
  "advanced":     "Advanced",
  "pro":          "Professional",
  "ALL LEVELS":   "All Levels",
};

// ─── Duration helper ──────────────────────────────────────────────────────────

function computeDuration(startRaw, endRaw) {
  if (!startRaw || !endRaw) return null;
  const diffMs = new Date(endRaw) - new Date(startRaw);
  if (diffMs <= 0) return null;
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const SectionDivider = () => (
  <div className="mx-7 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

/**
 * Section label — slightly elevated from near-invisible to legible-but-subtle.
 * neutral-400 reads clearly while still feeling like system typography.
 */
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2">
    {children}
  </p>
);

/**
 * Sub-label inside a chip group (e.g. "Instruments", "Roles").
 * One step dimmer than SectionLabel — it's a qualifier, not a heading.
 */
const SubLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-1">
    {children}
  </p>
);

/**
 * DetailItem — label above value.
 * Label is deliberately dim; value is the readable element.
 */
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

/** Chip in genre / vibe / instrument / role / gear lists. */
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

/** Labelled chip group. Returns null when items is empty. */
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

// ─── Main component ───────────────────────────────────────────────────────────

const JamDetailSections = ({ item, accent }) => {
  // ── 1. Looking for ──────────────────────────────────────────────────────────
  const instruments   = item?.instrumentsNeeded ?? item?.instruments ?? [];
  const rolesNeeded   = item?.rolesNeeded ?? [];
  const hasLookingFor = instruments.length > 0 || rolesNeeded.length > 0;

  // ── 2. Primary details ──────────────────────────────────────────────────────
  const endDateTime = item?.endDateTime ?? null;
  const duration    = computeDuration(item?.dateTimeRaw, item?.endDateTimeRaw);
  const jamType     = item?.jamType
    ? (JAM_TYPE_LABELS[item.jamType] ?? item.jamType)
    : null;
  const skillLevel  = item?.skillLevel
    ? (SKILL_LEVEL_LABELS[item.skillLevel] ?? item.skillLevel)
    : null;

  const capacityState = getCapacityState(item);
  const attendeeCount = item?.attendeeCount ?? null;
  const capacity      = item?.capacity ?? null;

  let capacityLine = null;
  if (attendeeCount != null && capacity != null) {
    capacityLine = `${attendeeCount} / ${capacity} attending`;
    if (capacityState.label) capacityLine += ` · ${capacityState.label}`;
  } else if (capacity != null) {
    capacityLine = `Up to ${capacity} attendees`;
    if (capacityState.label) capacityLine += ` · ${capacityState.label}`;
  } else if (attendeeCount != null) {
    capacityLine = `${attendeeCount} attending`;
  }

  // Collect only the detail fields that actually have values — drives adaptive layout.
  const detailEntries = [
    { label: "Ends",        value: endDateTime },
    { label: "Duration",    value: duration    },
    { label: "Format",      value: jamType     },
    { label: "Skill level", value: skillLevel  },
  ].filter((e) => e.value);

  const hasDetails = detailEntries.length > 0 || !!capacityLine;

  // ── 3. Genres + Vibes ───────────────────────────────────────────────────────
  const genres         = item?.genres ?? [];
  const vibes          = item?.vibes ?? [];
  const hasGenresVibes = genres.length > 0 || vibes.length > 0;
  const hasBothColumns = genres.length > 0 && vibes.length > 0;

  // ── 4. Location guide ───────────────────────────────────────────────────────
  const locationGuide = item?.locationGuide ?? null;

  // ── 5. Gear ─────────────────────────────────────────────────────────────────
  const gearProvided = item?.gearProvidedItems ?? item?.equipmentAvailable ?? [];
  const gearNeeded   = item?.gearNeededItems   ?? item?.equipmentNeeded    ?? [];
  const hasGear      = gearProvided.length > 0 || gearNeeded.length > 0;

  if (!hasLookingFor && !hasDetails && !hasGenresVibes && !locationGuide && !hasGear) {
    return null;
  }

  return (
    <>
      {/* ── 1. Looking for ───────────────────────────────────────────────── */}
      {hasLookingFor && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            {/* Slightly brighter label — this is the key decision-making section */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2.5">
              Looking for
            </p>
            <div className="space-y-2">
              <ChipGroup
                label={rolesNeeded.length > 0 ? "Instruments" : null}
                items={instruments}
              />
              <ChipGroup label="Roles" items={rolesNeeded} />
            </div>
          </div>
        </>
      )}

      {/* ── 2. Primary details (adaptive layout) ─────────────────────────── */}
      {hasDetails && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <SectionLabel>Details</SectionLabel>

            {/*
              Adaptive layout:
                - 1 entry, no capacity → single full-width item (no phantom empty column)
                - 2+ entries, or capacity line → 2-column spec grid
              This prevents a lonely item sitting in col-1 with col-2 empty.
            */}
            {detailEntries.length === 1 && !capacityLine ? (
              <DetailItem label={detailEntries[0].label} value={detailEntries[0].value} />
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {detailEntries.map((e) => (
                  <DetailItem key={e.label} label={e.label} value={e.value} />
                ))}
                {capacityLine && (
                  <div className="col-span-2">
                    <DetailItem label="Capacity" value={capacityLine} />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 3. Genres + Vibes ────────────────────────────────────────────── */}
      {hasGenresVibes && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            {hasBothColumns ? (
              /*
                Both sides present — balanced two-column layout.
                flex-1 gives equal width regardless of chip count,
                so the block reads as a deliberate paired section.
              */
              <div className="flex gap-6">
                <div className="flex-1 min-w-0">
                  <ChipGroup label="Genres" items={genres} accent={accent} highlight />
                </div>
                <div className="flex-1 min-w-0">
                  <ChipGroup label="Vibe" items={vibes} />
                </div>
              </div>
            ) : (
              /*
                Single side only — renders full-width with no phantom column.
                ChipGroup returns null when its items array is empty, so only
                the side that has content renders.
              */
              <>
                <ChipGroup label="Genres" items={genres} accent={accent} highlight />
                <ChipGroup label="Vibe"   items={vibes} />
              </>
            )}
          </div>
        </>
      )}

      {/* ── 4. Location guide ────────────────────────────────────────────── */}
      {locationGuide && (
        <>
          <SectionDivider />
          <div className="px-7 py-3">
            <SectionLabel>Location guide</SectionLabel>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {locationGuide}
            </p>
          </div>
        </>
      )}

      {/* ── 5. Gear ──────────────────────────────────────────────────────── */}
      {hasGear && (
        <>
          <SectionDivider />
          <div className="px-7 py-3 space-y-2">
            <SectionLabel>Gear</SectionLabel>
            <ChipGroup label="Provided"       items={gearProvided} />
            <ChipGroup label="Bring your own" items={gearNeeded} />
          </div>
        </>
      )}
    </>
  );
};

export default JamDetailSections;
