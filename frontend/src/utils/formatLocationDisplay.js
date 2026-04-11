/**
 * utils/formatLocationDisplay.js
 *
 * Display-only formatter for a selected geocoder Place.
 * Does NOT mutate the place object — safe to call anywhere.
 *
 * Rules:
 *   poi      → place name as primary, full address as secondary
 *   address  → full street address (house + street) as primary, city/state/zip/country as secondary
 *   street   → street name as primary, city/state/country as secondary
 *   place    → place name as primary, region/country as secondary (fallback)
 */

/**
 * @param {object} place — Normalized Place from mapTilerResultToPlace()
 * @returns {{ primaryLabel: string, secondaryLabel: string, kind: 'poi'|'address'|'street'|'place' }}
 */
export function formatSelectedLocationDisplay(place) {
  const { featureType, houseNumber, placeName, address, city, region, postalCode, country } = place;

  // ── Custom / manually-entered location ────────────────────────────────────
  if (place.isCustom || featureType === "custom") {
    return {
      primaryLabel:   placeName,
      secondaryLabel: address || "Custom location",
      kind:           "custom",
    };
  }

  // ── Named POI / business / institution / landmark ──────────────────────────
  if (featureType === "poi") {
    return {
      primaryLabel:   placeName,
      secondaryLabel: address,
      kind:           "poi",
    };
  }

  // ── Exact address with a house / building number ───────────────────────────
  // placeName here is the street name (e.g. "Southwest 173rd Street")
  // houseNumber is the building number (e.g. "7720")
  if (featureType === "address" && houseNumber) {
    const streetAddress = `${houseNumber} ${placeName}`;
    const localeParts   = [city, region, postalCode, country].filter(Boolean);
    return {
      primaryLabel:   streetAddress,
      secondaryLabel: localeParts.join(", "),
      kind:           "address",
    };
  }

  // ── Street-level result (address type but no house number) ────────────────
  if (featureType === "address" || featureType === "street") {
    const localeParts = [city, region, country].filter(Boolean);
    return {
      primaryLabel:   placeName,
      secondaryLabel: localeParts.join(", "),
      kind:           "street",
    };
  }

  // ── City / neighbourhood / municipality / locality / unknown ──────────────
  const localeParts = [region, country].filter(Boolean);
  return {
    primaryLabel:   placeName,
    secondaryLabel: localeParts.join(", ") || address,
    kind:           "place",
  };
}

/**
 * Format a kilometre distance as miles for display in result rows.
 * Used as the primary distance label — the app targets U.S. users.
 *
 * @param {number|null} km
 * @returns {string|null} e.g. "0.3 mi", "2.4 mi", "38 mi" — or null if km is null/negative
 */
export function formatDistanceMiles(km) {
  if (km == null || km < 0) return null;
  const mi = km * 0.621371;
  if (mi < 0.1)  return "< 0.1 mi";
  if (mi < 10)   return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

/**
 * Format a kilometre distance for compact display in result rows.
 *
 * @param {number|null} km
 * @returns {string|null} e.g. "350 m", "1.4 km", "12 km" — or null if km is null/negative
 */
export function formatDistanceKm(km) {
  if (km == null || km < 0) return null;
  if (km < 1)   return `${Math.round(km * 1000)} m`;
  if (km < 10)  return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
