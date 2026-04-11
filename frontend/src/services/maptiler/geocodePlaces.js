/**
 * services/maptiler/geocodePlaces.js
 *
 * MapTiler geocoding / place-search service.
 *
 * Returns raw GeoJSON Feature objects — always pass through
 * mapTilerResultToPlace() before using in form state.
 *
 * Note on bbox vs proximity:
 *   This service uses proximity (coordinate bias) rather than bbox (hard restriction)
 *   so that relevant results just outside the visible area are still returned as
 *   candidates. The client-side reranker applies a viewport containment bonus to
 *   surface in-bounds results at the top.
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
 * @param {number}      [opts.limit=10]
 * @param {string}      [opts.language="en"]
 * @param {{ latitude: number, longitude: number }|null} [opts.proximity]
 *   Optional coords to bias results toward (user location or map center).
 *   Format sent to MapTiler: "longitude,latitude"
 * @param {AbortSignal|null} [opts.signal]
 *   Optional AbortSignal to cancel an in-flight request.
 *   Cancelled requests resolve to [] so callers don't need to catch AbortError.
 *
 * @returns {Promise<object[]>} Raw GeoJSON Feature array (may be empty)
 * @throws {Error}              On non-2xx HTTP response (404 → empty, not thrown)
 */
export async function geocodePlaces(
  query,
  { limit = 10, language = "en", proximity = null, signal = null } = {},
) {
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

  if (proximity) {
    params.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const url      = `${BASE}/${encodeURIComponent(trimmed)}.json?${params}`;
  const fetchOpts = signal ? { signal } : {};

  let res;
  try {
    res = await fetch(url, fetchOpts);
  } catch (err) {
    // AbortError from a cancelled request — not an error, return empty
    if (err?.name === "AbortError") return [];
    throw err;
  }

  if (res.status === 404) return []; // no results, not an error

  if (!res.ok) {
    throw new Error(`MapTiler geocoding failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.features ?? [];
}
