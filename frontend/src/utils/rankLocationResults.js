/**
 * utils/rankLocationResults.js
 *
 * Geographic-aware ranking for geocoder results.
 *
 * Modes:
 *   'local-biased' — scores by text relevance + proximity + viewport containment.
 *                    Locally relevant results surface first; distant ones stay
 *                    accessible but ranked lower.
 *   'global'       — text relevance only; provider order is preserved for
 *                    distant / out-of-area queries.
 *
 * Context shape:
 *   { center: { latitude, longitude }, bounds?: { north, south, east, west } }
 *
 * Only the center is required. bounds is optional (not available until the map
 * has rendered and reported its viewport).
 */

// ── Haversine distance (km) ───────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
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

// ── Text relevance score (same logic as previous rankPlaces) ─────────────────

function textScore(place, query) {
  const q      = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  const name   = place.placeName.toLowerCase();
  const addr   = place.address.toLowerCase();
  let score    = 0;

  if (name === q)                                                           score += 200;
  else if (name.startsWith(q))                                             score += 120;
  else if (name.includes(q))                                               score += 80;
  else if (tokens.length >= 2 && tokens.every((t) => name.includes(t)))   score += 60;
  else if (tokens.length >= 2 && tokens.every((t) => addr.includes(t)))   score += 40;
  else {
    score += tokens.filter((t) => name.includes(t)).length * 15;
    score += tokens.filter((t) => addr.includes(t)).length * 8;
  }
  if (q.length > 10 && name.length < 14 && score < 50) score -= 30;
  return score;
}

// ── Geographic score (only applied in local-biased mode) ─────────────────────

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
    if (inViewport) bonus += 80;
  }

  // Distance decay — soft, not a hard cutoff
  // ~0 km → +60   ~10 km → +45   ~40 km → +25   ~80 km → +10   >200 km → -20
  if      (km <   5) bonus += 60;
  else if (km <  15) bonus += 45;
  else if (km <  40) bonus += 25;
  else if (km <  80) bonus += 10;
  else if (km > 200) bonus -= 20;

  return bonus;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {object[]} places  — Normalized Place[] from mapTilerResultToPlace()
 * @param {string}   query   — Current search string
 * @param {object|null} context — { center, bounds? } or null
 * @param {'local-biased'|'global'} mode
 * @returns {object[]}       — Re-ranked Place[]
 */
export function rankLocationResults(places, query, context = null, mode = "local-biased") {
  return places
    .map((place) => {
      const score =
        textScore(place, query) +
        (mode === "local-biased" ? geoScore(place, context) : 0);
      return { place, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}
