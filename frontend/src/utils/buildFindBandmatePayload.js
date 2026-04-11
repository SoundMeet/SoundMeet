/**
 * utils/buildFindBandmatePayload.js
 *
 * Transforms FindBandmateForm state into a clean backend-ready payload.
 *
 * When the real endpoint is wired up, update field names here only —
 * the rest of the form code stays unchanged.
 */

import { placeToOpportunityAreaText } from "./location/adapters";

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
 * @returns {object}          — Backend-ready listing payload
 */
export function buildFindBandmatePayload(formValues) {
  const {
    // Step 1 — Band / Project Basics
    bandProjectName,
    postedByUserId,
    postedByName,
    selectedPlace,
    locationQuery  = "",
    coverImage = null,
    headline,
    aboutProject,

    // Step 2 — Sound & Identity
    genres,
    vibe,
    influences,
    coversOriginals,
    currentLineup,
    projectLevel,

    // Step 3 — The Opening
    rolesNeeded,
    skillLevelDesired,
    availability,
    commitmentLevel,
    whatLookingFor,
    contactInfo,
  } = formValues;

  const payload = {
    // ── Band / Project core ───────────────────────────────────────────────────
    band_project_name: bandProjectName.trim(),
    posted_by_user_id: postedByUserId ?? null,
    posted_by_name:    trimOrNull(postedByName),
    // city_area extracted from the unified Place or falls back to raw query text
    city_area:         placeToOpportunityAreaText(selectedPlace, locationQuery),
    headline:          trimOrNull(headline),
    about_project:     trimOrNull(aboutProject),

    // ── Sound & Identity ──────────────────────────────────────────────────────
    genres:           flattenTagGroup(genres),
    vibe:             flattenTagGroup(vibe),
    influences:       flattenTagGroup(influences),
    covers_originals: coversOriginals ?? null,
    current_lineup:   flattenTagGroup(currentLineup),
    project_level:    projectLevel ?? null,

    // ── The Opening ───────────────────────────────────────────────────────────
    roles_needed:        flattenTagGroup(rolesNeeded),
    skill_level_desired: skillLevelDesired ?? null,
    availability:        flattenTagGroup(availability),
    commitment_level:    commitmentLevel ?? null,
    what_looking_for:    trimOrNull(whatLookingFor),
    contact_info:        trimOrNull(contactInfo),

    // ── Media ─────────────────────────────────────────────────────────────────
    // In prod: upload the file to storage first, then set cover_image_url to the returned URL.
    cover_image_url: coverImage?.previewUrl ?? null,
  };

  // TODO: await api.findBandmate(payload);
  // Update field names in this file only when the endpoint is ready.
  console.log("payload:", payload);

  return payload;
}
