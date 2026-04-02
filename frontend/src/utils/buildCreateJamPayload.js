/**
 * utils/buildCreateJamPayload.js
 *
 * Transforms CreateJamFormValues into a clean backend-ready payload.
 *
 * This is the single place where form state maps to API/database shape.
 * When the real endpoint is wired up, update the field names here only —
 * the rest of the form code stays unchanged.
 *
 * Usage:
 *   const payload = buildCreateJamPayload(formValues);
 *   // TODO: await api.createJam(payload);
 *   console.log("🎵 Create Jam payload:", payload);
 */

/**
 * Flattens a TagGroupState into a plain string array for the backend.
 * Preset IDs and custom free-text values are merged into one list.
 */
const flattenTagGroup = (group) => [
  ...(group?.presetIds ?? []),
  ...(group?.customValues ?? []),
];

/**
 * @param {object} formValues — CreateJamFormValues (from CreateJamForm state)
 * @returns {object}          — Backend-ready jam insert payload
 */
export function buildCreateJamPayload(formValues) {
  const {
    title,
    description,
    date,
    startTime,
    endTime,

    genres,
    vibes,
    instrumentsNeeded,
    jamTypes,
    rolesNeeded,
    equipmentAvailable,
    equipmentNeeded,
    skillLevel,

    isOpenToAllGenres,
    isOpenToAllVibes,
    isOpenToAllInstruments,

    maxParticipants,
    isPrivate,

    selectedPlace,
    locationGuide,

    coverImage = null,
  } = formValues;

  return {
    // ── Core ──────────────────────────────────────────────────────────────────
    title: title.trim(),
    description: description.trim() || null,

    // ── Schedule ──────────────────────────────────────────────────────────────
    date,
    start_time: startTime,
    end_time: endTime || null,

    // ── Taxonomy ──────────────────────────────────────────────────────────────
    // When "open to all" is true the array is empty — backend interprets [] + flag as "any"
    genres:             isOpenToAllGenres      ? [] : flattenTagGroup(genres),
    vibes:              isOpenToAllVibes       ? [] : flattenTagGroup(vibes),
    instruments_needed: isOpenToAllInstruments ? [] : flattenTagGroup(instrumentsNeeded),
    accepts_all_genres:      isOpenToAllGenres,
    accepts_all_vibes:       isOpenToAllVibes,
    accepts_all_instruments: isOpenToAllInstruments,
    jam_types:          flattenTagGroup(jamTypes),
    roles_needed:       flattenTagGroup(rolesNeeded),
    equipment_available: flattenTagGroup(equipmentAvailable),
    equipment_needed:   flattenTagGroup(equipmentNeeded),
    skill_level: skillLevel ?? null,

    // ── Participation ─────────────────────────────────────────────────────────
    max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
    is_private: isPrivate,

    // ── Location ──────────────────────────────────────────────────────────────
    // Structured for a separate locations table or a JSONB column
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

    // ── Extra directions ──────────────────────────────────────────────────────
    // Free-text wayfinding note from the creator — kept separate from the
    // structured location object so it maps cleanly to its own column/field.
    location_guide: locationGuide?.trim() || null,

    // ── Media ─────────────────────────────────────────────────────────────────
    // In dev/mock: previewUrl is a local object URL (not persisted).
    // In prod: upload the file to storage first, then set cover_image_url to the returned URL.
    // Backend field: cover_image_url (nullable URLField / text column).
    cover_image_url: coverImage?.previewUrl ?? null,
  };
}
