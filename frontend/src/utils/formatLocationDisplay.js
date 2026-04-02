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
  // TODO: remove before shipping — helps verify adapter extraction in dev
  console.debug("[formatLocation]", { featureType, houseNumber, city, postalCode, placeName });

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
