/**
 * services/maptiler/geocodePlaces.js
 *
 * MapTiler geocoding / place-search service.
 *
 * Returns raw GeoJSON Feature objects — always pass through
 * mapTilerResultToPlace() before using in form state.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const BASE = "https://api.maptiler.com/geocoding";

/**
 * Feature types to include in results.
 * Prioritizes named places and POIs over country/region entries.
 * See: https://docs.maptiler.com/cloud/geocoding/get/
 */
const RESULT_TYPES = [
  "poi",
  "address",
  "place",
  "municipality",
  "locality",
  "neighbourhood",
].join(",");

/**
 * Search for places matching a text query.
 *
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.limit=8]
 * @param {string} [opts.language="en"]
 * @param {{ latitude: number, longitude: number }|null} [opts.proximity]
 *   Optional coords to bias results toward (user location or map center).
 *   Format sent to MapTiler: "longitude,latitude"
 *
 * @returns {Promise<object[]>} Raw GeoJSON Feature array (may be empty)
 * @throws {Error}              On non-2xx HTTP response (404 → empty, not thrown)
 */
export async function geocodePlaces(query, { limit = 8, language = "en", proximity = null } = {}) {
  const trimmed = query?.trim() ?? "";
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    key:          MAPTILER_KEY,
    limit:        String(limit),
    language,
    types:        RESULT_TYPES,
    autocomplete: "true", // enables prefix matching for as-you-type search
    fuzzyMatch:   "true", // tolerates minor typos
  });

  // Proximity bias — weights results nearer to this coordinate
  if (proximity) {
    params.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const url = `${BASE}/${encodeURIComponent(trimmed)}.json?${params}`;
  const res  = await fetch(url);

  if (res.status === 404) return []; // no results, not an error

  if (!res.ok) {
    throw new Error(`MapTiler geocoding failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.features ?? [];
}
