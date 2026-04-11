/**
 * utils/rankLocationResults.js
 *
 * Geographic-aware ranking for geocoder results.
 *
 * Modes:
 *   'local-biased' — scores by text relevance + venue type + proximity + viewport
 *                    containment + recency. Locally relevant results surface first.
 *   'global'       — text relevance + venue type + recency only; provider order is
 *                    preserved for distant / out-of-area queries.
 *
 * Context shape:
 *   { center: { latitude, longitude }, bounds?: { north, south, east, west } }
 *
 * Only the center is required. bounds is optional (reported by MapLocationPreview
 * after the map renders and on every pan/zoom end).
 */

import { parseQuery, normalizeQuery } from "./normalizeSearchQuery.js";
import { recentVenueBoost }           from "./recentVenues.js";

// ── Haversine distance (km) ───────────────────────────────────────────────────

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometres
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Text relevance score ──────────────────────────────────────────────────────
// Uses normalizeQuery so "The Boombox" / "the boombox" / "boombox" compare equally.

function textScore(place, parsedQuery) {
  const { normalized: q, tokens } = parsedQuery;
  const name = normalizeQuery(place.placeName ?? "");
  const addr = (place.address ?? "").toLowerCase();
  let score  = 0;

  if (name === q)                                                              score += 200;
  else if (name.startsWith(q))                                                score += 130;
  else if (name.includes(q))                                                  score += 90;
  else if (tokens.length >= 2 && tokens.every((t) => name.includes(t)))      score += 70;
  else if (tokens.length >= 2 && tokens.every((t) => addr.includes(t)))      score += 45;
  else {
    score += tokens.filter((t) => name.includes(t)).length * 20;
    score += tokens.filter((t) => addr.includes(t)).length * 8;
  }

  // Penalise very short place names when the query is long — likely a poor match
  if (q.length > 10 && name.length < 12 && score < 50) score -= 30;

  return score;
}

// ── Venue type boost ──────────────────────────────────────────────────────────
// POIs are the most relevant feature type for jam/show venue searches.

function venueTypeScore(place) {
  return place.featureType === "poi" ? 30 : 0;
}

// ── Geographic score (local-biased mode only) ─────────────────────────────────

function geoScore(place, context) {
  if (!context?.center) return 0;

  const { center, bounds } = context;
  const km = haversineKm(
    center.latitude, center.longitude,
    place.latitude,  place.longitude,
  );

  // Viewport containment — strongest local signal
  let bonus = 0;
  if (bounds) {
    const { north, south, east, west } = bounds;
    const inViewport =
      place.latitude  >= south && place.latitude  <= north &&
      place.longitude >= west  && place.longitude <= east;
    if (inViewport) bonus += 100;
  }

  // Distance decay — soft, not a hard cutoff
  if      (km <   2) bonus += 70;
  else if (km <   5) bonus += 60;
  else if (km <  15) bonus += 45;
  else if (km <  40) bonus += 25;
  else if (km <  80) bonus += 10;
  else if (km > 200) bonus -= 25;

  return bonus;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {object[]} places    — Normalized Place[] from mapTilerResultToPlace()
 * @param {string}   query     — Current search string (raw, will be normalized internally)
 * @param {object|null} context — { center, bounds? } or null
 * @param {'local-biased'|'global'} mode
 * @returns {object[]}         — Re-ranked Place[]
 */
export function rankLocationResults(places, query, context = null, mode = "local-biased") {
  const parsedQuery = parseQuery(query);

  return places
    .map((place) => {
      const score =
        textScore(place, parsedQuery) +
        venueTypeScore(place) +
        (mode === "local-biased" ? geoScore(place, context) : 0) +
        recentVenueBoost(place.id);
      return { place, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}
