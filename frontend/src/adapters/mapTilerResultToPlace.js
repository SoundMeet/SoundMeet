/**
 * adapters/mapTilerResultToPlace.js
 *
 * Single boundary between the MapTiler API response shape and the rest of the app.
 * Raw MapTiler GeoJSON feature objects must not spread beyond this file.
 *
 * Normalized Place shape (CreateJamFormValues.selectedPlace):
 * {
 *   id:              string       — MapTiler feature id (stable within a session)
 *   placeName:       string       — Short display name (e.g. "Central Park", or street name for addresses)
 *   address:         string       — Full formatted address string (place_name)
 *   latitude:        number
 *   longitude:       number
 *   city:            string|null
 *   region:          string|null  — State / province
 *   postalCode:      string|null
 *   country:         string|null
 *   featureType:     string|null  — MapTiler type: "poi" | "address" | "place" | "municipality" | …
 *   houseNumber:     string|null  — Building/house number for address-type results (feature.address)
 *   category:        string|null  — MapTiler POI category if available (e.g. "music_venue", "bar")
 *   providerName:    "maptiler"   — Always "maptiler"; ready for future multi-provider support
 *   providerPlaceId: string|null  — Raw provider id for deduplication / deep-link purposes
 * }
 *
 * Future: add reverseGeocode(lat, lng) here to resolve coordinates back to a
 * place name after the user drags the map marker. The form is already structured
 * to accept the result — no other changes needed.
 */

/**
 * @param {object} feature — Raw GeoJSON Feature from geocodePlaces()
 * @returns {object}       — Normalized Place
 */
export function mapTilerResultToPlace(feature) {
  const [longitude, latitude] = feature.geometry.coordinates;
  const context = feature.context ?? [];

  // MapTiler follows Mapbox-compatible GeoJSON — type lives in place_type[] or the id prefix.
  // feature.feature_type is NOT a standard field; derive robustly from all three sources.
  const featureType =
    feature.feature_type           ??   // non-standard but safe to check first
    feature.place_type?.[0]        ??   // standard Mapbox-compatible array
    feature.id?.split(".")?.[0]    ??   // id prefix: "address.xxx" → "address"
    null;

  // City-level entry: MapTiler encodes sub-city localities as "place", "municipality",
  // "locality", or "neighbourhood" depending on the result. Check all of them.
  const CITY_PREFIXES = ["place", "municipality", "locality", "neighbourhood"];
  const cityEntry = context.find((c) =>
    CITY_PREFIXES.some((prefix) => c.id?.startsWith(prefix))
  );

  return {
    id:              feature.id,
    placeName:       feature.text ?? feature.place_name,
    address:         feature.place_name,
    latitude,
    longitude,
    city:            cityEntry?.text                                             ?? null,
    region:          context.find((c) => c.id?.startsWith("region"))?.text     ?? null,
    postalCode:      context.find((c) => c.id?.startsWith("postcode"))?.text   ?? null,
    country:         context.find((c) => c.id?.startsWith("country"))?.text    ?? null,
    featureType,
    houseNumber:     feature.address ?? null,  // building number on address-type results
    category:        feature.properties?.category ?? null,
    providerName:    "maptiler",
    providerPlaceId: feature.id ?? null,
  };
}
