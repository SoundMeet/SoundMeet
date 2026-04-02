/**
 * utils/buildFindBandmatePayload.js
 *
 * Transforms FindBandmateForm state into a clean backend-ready payload.
 *
 * When the real endpoint is wired up, update field names here only —
 * the rest of the form code stays unchanged.
 */

/**
 * Flattens a TagGroupState { selectedIds, customValues } into a plain string array.
 */
const flattenTagGroup = (group) => [
  ...(group?.selectedIds ?? []),
  ...(group?.customValues ?? []),
];

const trimOrNull = (val) => (typeof val === "string" ? val.trim() || null : null);

/**
 * @param {object} formValues — FindBandmateForm state
 * @returns {object}          — Backend-ready bandmate profile payload
 */
export function buildFindBandmatePayload(formValues) {
  const {
    displayName,
    city,
    genres,
    instrumentsYouPlay,
    vibes,
    skillLevel,
    rolesSeeking,
    availability,
    description,
    contactInfo,
    coverImage = null,
  } = formValues;

  const payload = {
    // ── Core ──────────────────────────────────────────────────────────────────
    display_name: displayName.trim(),
    city:         city.trim(),
    description:  trimOrNull(description),
    contact_info: trimOrNull(contactInfo),

    // ── Music profile ─────────────────────────────────────────────────────────
    genres:              flattenTagGroup(genres),
    instruments_you_play: flattenTagGroup(instrumentsYouPlay),
    vibes:               flattenTagGroup(vibes),
    skill_level:         skillLevel ?? null,

    // ── Preferences ───────────────────────────────────────────────────────────
    roles_seeking: flattenTagGroup(rolesSeeking),
    availability:  flattenTagGroup(availability),

    // ── Media ─────────────────────────────────────────────────────────────────
    // In prod: upload the file to storage first, then set cover_image_url to the returned URL.
    // Backend field: cover_image_url (nullable URLField / text column).
    cover_image_url: coverImage?.previewUrl ?? null,
  };

  // TODO: await api.findBandmate(payload);
  // Update field names in this file only when the endpoint is ready.
  console.log("payload:", payload);

  return payload;
}
