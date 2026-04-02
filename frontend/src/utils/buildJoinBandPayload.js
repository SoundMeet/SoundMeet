/**
 * utils/buildJoinBandPayload.js
 *
 * Transforms JoinBandForm state into a clean backend-ready payload.
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
 * @param {object} formValues — JoinBandForm state
 * @returns {object}          — Backend-ready band listing payload
 */
export function buildJoinBandPayload(formValues) {
  const {
    bandName,
    genres,
    city,
    rolesNeeded,
    instrumentsNeeded,
    vibes,
    skillLevel,
    description,
    contactInfo,
    isPrivate,
    coverImage = null,
  } = formValues;

  const payload = {
    // ── Core ──────────────────────────────────────────────────────────────────
    band_name:   bandName.trim(),
    city:        city.trim(),
    description: trimOrNull(description),
    contact_info: trimOrNull(contactInfo),

    // ── Taxonomy ──────────────────────────────────────────────────────────────
    genres:             flattenTagGroup(genres),
    roles_needed:       flattenTagGroup(rolesNeeded),
    instruments_needed: flattenTagGroup(instrumentsNeeded),
    vibes:              flattenTagGroup(vibes),
    skill_level:        skillLevel ?? null,

    // ── Privacy ───────────────────────────────────────────────────────────────
    is_private: isPrivate,

    // ── Media ─────────────────────────────────────────────────────────────────
    // In prod: upload the file to storage first, then set cover_image_url to the returned URL.
    // Backend field: cover_image_url (nullable URLField / text column).
    cover_image_url: coverImage?.previewUrl ?? null,
  };

  // TODO: await api.joinBand(payload);
  // Update field names in this file only when the endpoint is ready.
  console.log("payload:", payload);

  return payload;
}
