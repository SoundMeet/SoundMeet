/**
 * utils/recentVenues.js
 *
 * Frontend-only session memory for recently selected venues.
 * Persisted in localStorage so selections survive page refreshes within a session.
 *
 * Entries are stored as lightweight Place subsets — only the fields needed for
 * display and ranking are kept.
 */

const STORAGE_KEY = "sm_recent_venues";
const MAX_RECENT  = 5;

// Fields persisted per entry — keeps storage light
const PERSISTED_FIELDS = [
  "id",
  "placeName",
  "address",
  "latitude",
  "longitude",
  "city",
  "region",
  "country",
  "featureType",
  "category",
];

function slim(place) {
  return Object.fromEntries(
    PERSISTED_FIELDS.filter((k) => place[k] != null).map((k) => [k, place[k]]),
  );
}

/**
 * Return all recent venue entries, newest first.
 * Returns [] on read failure (e.g. storage unavailable, corrupt JSON).
 *
 * @returns {object[]}
 */
export function getRecentVenues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Prepend a selected place to the recent venues list.
 * Deduplicates by id so the same venue does not appear twice.
 *
 * @param {object} place — Normalized Place from mapTilerResultToPlace()
 */
export function saveRecentVenue(place) {
  try {
    const existing = getRecentVenues().filter((p) => p.id !== place.id);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([slim(place), ...existing].slice(0, MAX_RECENT)),
    );
  } catch {
    // localStorage unavailable — silently skip
  }
}

/**
 * Score boost for a recently selected place.
 * Recency decays with position: first = +50, second = +35, etc.
 * Returns 0 if the place is not in the recents list.
 *
 * @param {string} placeId
 * @returns {number}
 */
export function recentVenueBoost(placeId) {
  const recents = getRecentVenues();
  const idx     = recents.findIndex((p) => p.id === placeId);
  if (idx === -1) return 0;
  return ([50, 35, 22, 14, 8])[idx] ?? 0;
}
