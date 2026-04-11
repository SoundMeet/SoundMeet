/**
 * services/maptiler/geocodeCustomLocation.js
 *
 * Forward-geocoding enrichment for manually entered jam locations.
 *
 * Strategy
 * ─────────
 * Rather than a single lookup, we try multiple queries in specificity order
 * and stop at the first result that passes quality gates:
 *
 *   1. address alone               → most likely to resolve precisely
 *   2. "name, address" combined    → adds venue context to a specific address
 *   3. name alone                  → last resort; high relevance threshold
 *
 * Quality gates (applied to every candidate result)
 * ──────────────────────────────────────────────────
 *   relevance   MapTiler's 0–1 confidence score. Each query strategy has its
 *               own minimum — name-only queries require higher confidence
 *               because the query is intentionally vague.
 *
 *   distance    When a proximity center is available (map center or device GPS),
 *               results further than MAX_DISTANCE_KM are rejected. This prevents
 *               accepting a geographically correct but contextually wrong match
 *               (e.g. "Practice Room B" in another state).
 *
 * Fallback
 * ────────
 * Returns null if every query fails or produces a result that doesn't pass the
 * gates. The caller should still save the jam with location_name/address/guide
 * — coordinates are enrichment, not a requirement.
 */

import { geocodePlaces } from "./geocodePlaces";

// ─── Thresholds ────────────────────────────────────────────────────────────────

/** Maximum distance from the bias center to accept a result (km). */
const MAX_DISTANCE_KM = 150;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Build the ordered list of (query, minRelevance) pairs to try.
 *
 * @param {string} name     — trimmed location name ("Tio's Backyard")
 * @param {string} address  — trimmed area/address ("Near FIU, 107th Ave")
 * @returns {{ text: string, minRelevance: number }[]}
 */
function buildQueryPlan(name, address) {
  const plan = [];

  // 1. Address alone — most reliably geocodable
  if (address) {
    plan.push({ text: address, minRelevance: 0.4 });
  }

  // 2. "Name, Address" — gives the geocoder venue context alongside the address
  if (name && address) {
    plan.push({ text: `${name}, ${address}`, minRelevance: 0.4 });
  }

  // 3. Name alone — vague; only accept high-confidence matches
  if (name) {
    plan.push({ text: name, minRelevance: 0.65 });
  }

  return plan;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Attempt to resolve coordinates for a manually entered location.
 *
 * @param {{ name: string, address: string }} fields
 *   The user's manual location inputs. Either may be empty.
 *
 * @param {{ latitude: number, longitude: number }|null} proximity
 *   Best-known geographic context (map center or device GPS).
 *   Used to bias results AND to distance-gate candidates.
 *   Pass null if no context is available — quality gates are automatically
 *   tightened to compensate.
 *
 * @param {AbortSignal|null} signal
 *   Optional AbortSignal. If aborted mid-flight, returns null immediately.
 *
 * @returns {Promise<{ latitude: number, longitude: number }|null>}
 *   Resolved coordinates, or null if no acceptable result was found.
 */
export async function geocodeCustomLocation(
  { name = "", address = "" },
  proximity = null,
  signal    = null,
) {
  const trimName    = name.trim();
  const trimAddress = address.trim();

  // Nothing to geocode
  if (!trimName && !trimAddress) return null;

  const plan = buildQueryPlan(trimName, trimAddress);
  if (!plan.length) return null;

  // Without a proximity center we tighten relevance by this offset to compensate
  // for the missing distance gate.
  const noProximityPenalty = proximity ? 0 : 0.15;

  for (const { text, minRelevance } of plan) {
    if (signal?.aborted) return null;

    let features;
    try {
      features = await geocodePlaces(text, {
        limit: 1,
        proximity,
        signal,
      });
    } catch {
      if (signal?.aborted) return null;
      continue; // non-abort error — try next query
    }

    if (!features.length) continue;

    const feature    = features[0];
    const relevance  = feature.relevance ?? 0;
    const threshold  = minRelevance + noProximityPenalty;

    // Relevance gate
    if (relevance < threshold) continue;

    const [longitude, latitude] = feature.geometry.coordinates;

    // Distance gate — only applied when a proximity center is available
    if (proximity) {
      const km = haversineKm(
        proximity.latitude,
        proximity.longitude,
        latitude,
        longitude,
      );
      if (km > MAX_DISTANCE_KM) continue; // plausible-sounding but too far away
    }

    // This result passes all gates — use it
    return { latitude, longitude };
  }

  return null;
}
