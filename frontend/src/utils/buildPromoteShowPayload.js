/**
 * utils/buildPromoteShowPayload.js
 *
 * Transforms PromoteShowForm state into a clean backend-ready payload.
 *
 * When the real endpoint is wired up, update field names here only —
 * the rest of the form code stays unchanged.
 */

/**
 * Flattens a TagGroupState { selectedIds, customValues } into a plain string array.
 * Preset IDs and custom free-text values are merged into one list.
 */
const flattenTagGroup = (group) => [
  ...(group?.selectedIds ?? []),
  ...(group?.customValues ?? []),
];

const trimOrNull = (val) => (typeof val === "string" ? val.trim() || null : null);

/**
 * @param {object} formValues — PromoteShowForm state
 * @returns {object}          — Backend-ready show insert payload
 */
export function buildPromoteShowPayload(formValues) {
  const {
    title,
    date,
    startTime,
    endTime,
    selectedPlace,
    locationGuide,
    genres,
    ticketPrice,
    ticketLink,
    description,
    maxCapacity,
    isPrivate,
    lineup    = [],
    coverImage = null,
  } = formValues;

  const payload = {
    // ── Core ──────────────────────────────────────────────────────────────────
    title: title.trim(),
    description: trimOrNull(description),

    // ── Schedule ──────────────────────────────────────────────────────────────
    date,
    start_time: startTime,
    end_time: endTime || null,

    // ── Location ──────────────────────────────────────────────────────────────
    location: selectedPlace
      ? {
          place_name: selectedPlace.placeName,
          address:    selectedPlace.address,
          latitude:   selectedPlace.latitude,
          longitude:  selectedPlace.longitude,
          city:       selectedPlace.city    ?? null,
          region:     selectedPlace.region  ?? null,
          country:    selectedPlace.country ?? null,
        }
      : null,
    location_guide: trimOrNull(locationGuide),

    // ── Taxonomy ──────────────────────────────────────────────────────────────
    genres: flattenTagGroup(genres),

    // ── Ticketing ─────────────────────────────────────────────────────────────
    ticket_price: ticketPrice !== "" ? parseFloat(ticketPrice) : null,
    ticket_link:  trimOrNull(ticketLink),

    // ── Capacity & privacy ────────────────────────────────────────────────────
    max_capacity: maxCapacity !== "" ? parseInt(maxCapacity, 10) : null,
    is_private: isPrivate,

    // ── Lineup ────────────────────────────────────────────────────────────────
    // Strip frontend-only `id` field before sending to the API.
    // Backend: store as jsonb column `lineup` or a separate ShowLineupAct FK table.
    lineup: lineup.map(({ name, role }) => ({ name, role: role || null })),

    // ── Media ─────────────────────────────────────────────────────────────────
    // In dev/mock: previewUrl is a local object URL (not persisted).
    // In prod: upload the file to storage first, then set cover_image_url to the returned URL.
    // Backend field: cover_image_url (nullable URLField / text column).
    cover_image_url: coverImage?.previewUrl ?? null,
  };

  // TODO: await api.promoteShow(payload);
  // Update field names in this file only when the endpoint is ready.
  console.log("payload:", payload);

  return payload;
}
