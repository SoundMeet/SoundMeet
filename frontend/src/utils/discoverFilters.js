// ── Constants ─────────────────────────────────────────────────────────────────

export const RADIUS_OPTIONS = [5, 10, 15, 25, 50];
export const DEFAULT_RADIUS = 25;

export const TIME_OPTIONS = ["Live Now", "Today", "Tonight", "This Week", "Any Time"];
export const DEFAULT_TIME = "Any Time";

export const SORT_OPTIONS = ["Closest", "Starting Soon", "Best Match", "Most Active"];
export const DEFAULT_SORT = "Closest";

export const INSTRUMENT_OPTIONS = [
  "Guitar", "Bass", "Drums", "Vocals", "Keys", "Producer", "Saxophone",
];
export const SKILL_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Open"];
export const JAM_TYPE_OPTIONS = ["Improv", "Rehearsal", "Open Jam", "Gig Prep", "Songwriting"];

export const DEFAULT_MORE_FILTERS = {
  instruments: [],
  skillLevels: [],
  jamTypes: [],
  includePrivate: true,
  beginnerOnly: false,
};

// ── Filtering ─────────────────────────────────────────────────────────────────

// Maps each time filter option to the timeSlot values it includes
const TIME_SLOT_SETS = {
  "Live Now":  new Set(["live"]),
  "Today":     new Set(["live", "tonight"]),
  "Tonight":   new Set(["tonight"]),
  "This Week": new Set(["live", "tonight", "tomorrow", "week"]),
  "Any Time":  null, // null = no restriction
};

export function applyFilters(jams, { radius, time, instruments, skillLevels, jamTypes, includePrivate, beginnerOnly }) {
  const allowedSlots = TIME_SLOT_SETS[time] ?? null;

  return jams.filter((jam) => {
    if (jam.distanceMiles != null && jam.distanceMiles > radius) return false;
    if (allowedSlots && jam.timeSlot && !allowedSlots.has(jam.timeSlot)) return false;

    const instrumentPool = [
      ...(jam.instruments ?? []),
      ...(jam.lookingFor ?? []),
      ...(jam.roles ?? []),
    ].map((value) => value.toLowerCase());

    if (
      instruments.length > 0 &&
      !instruments.some((instrument) =>
        instrumentPool.some((candidate) =>
          candidate.includes(instrument.toLowerCase())
        )
      )
    ) {
      return false;
    }

    if (skillLevels.length > 0 && jam.skillLevel && !skillLevels.includes(jam.skillLevel)) {
      return false;
    }

    if (jamTypes.length > 0) {
      if (jam.type !== "jam" || !jamTypes.includes(jam.jamType)) return false;
    }

    if (!includePrivate && jam.isPrivate) return false;

    if (
      beginnerOnly &&
      jam.skillLevel &&
      !["Beginner", "Open"].includes(jam.skillLevel)
    ) {
      return false;
    }

    return true;
  });
}

// ── Sorting ───────────────────────────────────────────────────────────────────

const TIME_SLOT_ORDER = { live: 0, tonight: 1, tomorrow: 2, week: 3 };

export function applySort(jams, sort) {
  const arr = [...jams];
  switch (sort) {
    case "Closest":
      return arr.sort((a, b) => a.distanceMiles - b.distanceMiles);

    case "Starting Soon":
      return arr.sort(
        (a, b) =>
          (TIME_SLOT_ORDER[a.timeSlot] ?? 9) - (TIME_SLOT_ORDER[b.timeSlot] ?? 9) ||
          a.distanceMiles - b.distanceMiles
      );

    case "Most Active":
      return arr.sort((a, b) => b.activityScore - a.activityScore);

    case "Best Match":
    default:
      // Prioritise live items, then beginner/open friendly items, then proximity
      return arr.sort(
        (a, b) =>
          (b.isLive ? 2 : 0) +
            (["Beginner", "Open"].includes(b.skillLevel) ? 1 : 0) -
            ((a.isLive ? 2 : 0) + (["Beginner", "Open"].includes(a.skillLevel) ? 1 : 0)) ||
          (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99)
      );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns [[sw_lng, sw_lat], [ne_lng, ne_lat]] bounding box for a given
 * radius (in miles) centered on a lat/lng point. Used to fit the map viewport.
 */
export function getRadiusBounds(lat, lng, radiusMiles) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - lngDelta, lat - latDelta], // SW
    [lng + lngDelta, lat + latDelta], // NE
  ];
}

/** Returns the number of active "more filters" for badge display. */
export function countActiveMoreFilters({ instruments, skillLevels, jamTypes, includePrivate, beginnerOnly }) {
  return (
    instruments.length +
    skillLevels.length +
    jamTypes.length +
    (!includePrivate ? 1 : 0) +
    (beginnerOnly ? 1 : 0)
  );
}
