/**
 * parseGeography.js
 *
 * Utilities for working with PostGIS geography values returned by Supabase.
 *
 * Supabase returns PostGIS geography columns as hex-encoded EWKB strings.
 * EWKB (Extended Well-Known Binary) format for a 2D Point with SRID:
 *   [1 byte]  byte order  (01 = little-endian)
 *   [4 bytes] type flags  (0x20000001 = Point | has-SRID flag)
 *   [4 bytes] SRID        (0x000010E6 = 4326)
 *   [8 bytes] X           (longitude, IEEE 754 double)
 *   [8 bytes] Y           (latitude,  IEEE 754 double)
 */

/**
 * Parses a PostGIS EWKB hex string into { latitude, longitude }.
 * Returns null if the input is missing, malformed, or not a Point.
 */
export function parseEWKBPoint(hex) {
  if (!hex || typeof hex !== 'string') return null;
  try {
    const pairs = hex.match(/.{1,2}/g);
    if (!pairs) return null;
    const bytes = new Uint8Array(pairs.map((b) => parseInt(b, 16)));
    const view = new DataView(bytes.buffer);
    const littleEndian = bytes[0] === 1;
    const typeFlags = view.getUint32(1, littleEndian);
    const hasSRID = (typeFlags & 0x20000000) !== 0;
    const offset = 5 + (hasSRID ? 4 : 0);
    const lng = view.getFloat64(offset, littleEndian);
    const lat = view.getFloat64(offset + 8, littleEndian);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

/**
 * Converts lat/lng to the PostGIS WKT Point format accepted by Supabase on insert.
 * Note: WKT uses (longitude latitude) order.
 */
export function toWKTPoint(latitude, longitude) {
  return `POINT(${longitude} ${latitude})`;
}
