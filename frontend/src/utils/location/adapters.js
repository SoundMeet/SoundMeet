/**
 * utils/location/adapters.js
 *
 * Bidirectional adapters between the unified frontend Place shape and each
 * form type's backend payload format. All location-specific transformation
 * logic lives here — payload builders and service methods should import
 * from this file rather than duplicating the logic.
 *
 * Unified Place shape (internal):
 *   id, placeName, address, latitude, longitude,
 *   city, region, postalCode, country,
 *   featureType, houseNumber, category,
 *   providerName, providerPlaceId,
 *   isCustom (boolean, optional)
 *
 * ── Hydration (backend → frontend Place) ─────────────────────────────────────
 *   hydrateJamLocation(jam)          → Place | null
 *   hydrateShowLocation(show)        → Place | null
 *
 * ── Payload adapters (frontend Place → backend field(s)) ─────────────────────
 *   placeToJamLocationFields(place)       → { location_name, location_address } fields
 *   placeToShowLocationObject(place)      → { place_name, address, latitude, ... }
 *   placeToOpportunityAreaText(place)     → string  (for join_band.city / find_bandmate.city_area)
 *
 * ── Text extraction helpers ───────────────────────────────────────────────────
 *   extractCityText(place)           → best available city/area string
 */

// ─── Hydration helpers ────────────────────────────────────────────────────────

/**
 * Build a frontend Place from a normalized jam object (from normalizeJamRow).
 * Used to prefill the location selector in Edit Jam flows.
 *
 * @param {object} jam — normalized jam from jamService (has locationName, locationAddress, coordinates)
 * @returns {object|null}
 */
export function hydrateJamLocation(jam) {
  if (!jam) return null;

  const { locationName, locationAddress, coordinates } = jam;

  // A jam always has at least a text name when a location was entered.
  if (!locationName && !locationAddress) return null;

  return {
    id:           `hydrated-jam-${jam.id}`,
    placeName:    locationName ?? locationAddress ?? "Unknown location",
    address:      locationAddress ?? locationName ?? null,
    latitude:     coordinates?.latitude  ?? null,
    longitude:    coordinates?.longitude ?? null,
    city:         null,
    region:       null,
    postalCode:   null,
    country:      null,
    featureType:  coordinates ? "poi" : "custom",
    houseNumber:  null,
    category:     null,
    providerName: coordinates ? "maptiler" : "manual",
    providerPlaceId: null,
    // Mark as custom if there are no coordinates (text-only legacy record)
    isCustom:     !coordinates,
  };
}

/**
 * Build a frontend Place from a normalized show object (from normalizeShowRow).
 * Used to prefill the location selector in Edit Show flows.
 *
 * @param {object} show — normalized show from showService
 * @returns {object|null}
 */
export function hydrateShowLocation(show) {
  if (!show) return null;

  // showService aliases location_name as venueName
  const locationName    = show.locationName ?? show.venueName ?? null;
  const locationAddress = show.locationAddress ?? null;
  const coordinates     = show.coordinates ?? null;

  if (!locationName && !locationAddress) return null;

  return {
    id:           `hydrated-show-${show.id}`,
    placeName:    locationName ?? locationAddress ?? "Unknown venue",
    address:      locationAddress ?? locationName ?? null,
    latitude:     coordinates?.latitude  ?? null,
    longitude:    coordinates?.longitude ?? null,
    city:         null,
    region:       null,
    postalCode:   null,
    country:      null,
    featureType:  coordinates ? "poi" : "custom",
    houseNumber:  null,
    category:     null,
    providerName: coordinates ? "maptiler" : "manual",
    providerPlaceId: null,
    isCustom:     !coordinates,
  };
}

/**
 * Build a frontend Place from a plain text city/area string.
 * Used for Join Band and Find a Bandmate edit-mode hydration.
 *
 * @param {string} cityText — e.g. "Miami, FL"
 * @param {string} [id]     — stable id for the synthetic place
 * @returns {object|null}
 */
export function hydrateCityAreaLocation(cityText, id = "hydrated-area") {
  const text = (cityText ?? "").trim();
  if (!text) return null;
  return {
    id:           id,
    placeName:    text,
    address:      null,
    latitude:     null,
    longitude:    null,
    city:         text,
    region:       null,
    postalCode:   null,
    country:      null,
    featureType:  "custom",
    houseNumber:  null,
    category:     null,
    providerName: "manual",
    providerPlaceId: null,
    isCustom:     true,
  };
}

// ─── Payload adapters ─────────────────────────────────────────────────────────

/**
 * Extract the WKT PostGIS location string for the jam backend (createJam / updateJam).
 * Returns null if the place has no coordinates.
 *
 * @param {object|null} place
 * @returns {string|null}  e.g. "SRID=4326;POINT(-80.19 25.77)"
 */
export function placeToJamWkt(place) {
  if (!place || place.latitude == null || place.longitude == null) return null;
  return `SRID=4326;POINT(${place.longitude} ${place.latitude})`;
}

/**
 * Additional text location fields appended to the jam FormData payload.
 * Returns { location_name, location_address } — both may be empty string.
 *
 * @param {object|null} place
 * @returns {{ location_name: string, location_address: string }}
 */
export function placeToJamTextFields(place) {
  return {
    location_name:    place?.placeName ?? "",
    location_address: place?.address   ?? "",
  };
}

/**
 * Build the location sub-object for the show payload (buildPromoteShowPayload).
 * Returns null when no place is selected.
 *
 * @param {object|null} place
 * @returns {object|null}
 */
export function placeToShowLocationObject(place) {
  if (!place) return null;
  return {
    place_name: place.placeName,
    address:    place.address,
    latitude:   place.latitude,
    longitude:  place.longitude,
    city:       place.city    ?? null,
    region:     place.region  ?? null,
    country:    place.country ?? null,
  };
}

/**
 * Extract the best text representation for city/area-based opportunity forms
 * (Join Band, Find a Bandmate).
 *
 * Priority: city field → formatted place name → raw address → empty string.
 *
 * @param {object|null}  place       — selected Place or null
 * @param {string}       [fallback]  — fallback text (e.g. from form.locationQuery)
 * @returns {string}
 */
export function placeToOpportunityAreaText(place, fallback = "") {
  if (!place) return (fallback ?? "").trim();

  // City field is the most concise representation
  if (place.city) {
    // Append region for city-level places to mirror the familiar "Miami, FL" format
    return place.region ? `${place.city}, ${place.region}` : place.city;
  }

  // Fall back to the place name (e.g. a typed custom area like "South Beach")
  if (place.placeName) return place.placeName;

  return (fallback ?? "").trim();
}

/**
 * Extract a short city/area text from a place for display or submission.
 * Alias of placeToOpportunityAreaText with no fallback — useful for validation.
 *
 * @param {object|null} place
 * @returns {string}
 */
export function extractCityText(place) {
  return placeToOpportunityAreaText(place, "");
}
