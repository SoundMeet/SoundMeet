/**
 * utils/buildJoinBandPayload.js
 *
 * Transforms Join a Band listing form state into a backend-ready payload.
 *
 * Accepts a second `profile` argument for fields that are read from the user's
 * existing SoundMeet profile rather than typed into the form.
 *
 * When the real endpoint is wired up, update field names here only —
 * the rest of the form code stays unchanged.
 */

import { placeToOpportunityAreaText } from "./location/adapters";

const flattenTagGroup = (group) => [
  ...(group?.selectedIds  ?? []),
  ...(group?.customValues ?? []),
];

const trimOrNull = (val) => (typeof val === "string" ? val.trim() || null : null);

/**
 * @param {object} formValues — JoinBandForm state
 * @param {object} profile    — { name, city, photoUrl } from the user's SoundMeet profile
 * @returns {object}          — Backend-ready listing payload
 */
export function buildJoinBandPayload(formValues, profile = {}) {
  const {
    // § 1 — About You (listing overrides)
    artistName,
    photo          = null,
    selectedPlace,
    locationQuery  = "",
    headline,
    bio,

    // § 2 — What You Play
    primaryRole,
    secondaryRoles,
    instruments,
    skillLevel,
    yearsPlaying,
    experience,
    gear,
    vocals,

    // § 3 — Style & Fit
    genres,
    vibes,
    influences,
    coversOriginals,

    // § 4 — Looking For
    opportunityTypes,
    commitment,
    availability,
    travelRadius,
    paidStatus,

    // § 5 — Links & Media
    featuredLink,
    audioLink,
    videoLink,
    instagram,
    youtube,
    spotifyOrWebsite,

    // § 6 — Listing Preferences
    listingStatus,
    openTo,
    collaborationScope,
    // preferredContact and draftStatus intentionally omitted — not surfaced in this flow
  } = formValues;

  return {
    // ── Identity ───────────────────────────────────────────────────────────────
    // profile_name is the authoritative account name — never overridden by the form
    profile_name: profile.name ?? null,
    // display_name falls back to profile name when no artist name override is set
    display_name: trimOrNull(artistName) ?? profile.name ?? null,
    artist_name:  trimOrNull(artistName),
    // city is extracted from the unified Place or falls back to raw query text / profile city
    city:         placeToOpportunityAreaText(selectedPlace, locationQuery) || profile.city || null,
    headline:     trimOrNull(headline),
    bio:          trimOrNull(bio),

    // ── Media ──────────────────────────────────────────────────────────────────
    // listing photo override takes priority; falls back to profile photo.
    // In prod: upload listing photo to storage, then set photo_url to the returned URL.
    photo_url: photo?.previewUrl ?? profile.photoUrl ?? null,

    // ── What You Play ──────────────────────────────────────────────────────────
    primary_role:    primaryRole   ?? null,
    secondary_roles: flattenTagGroup(secondaryRoles),
    instruments:     flattenTagGroup(instruments),
    skill_level:     skillLevel    ?? null,
    years_playing:   yearsPlaying  ?? null,
    experience:      experience    ?? [],
    gear:            trimOrNull(gear),
    vocals:          vocals        ?? null,

    // ── Style & Fit ────────────────────────────────────────────────────────────
    genres:           flattenTagGroup(genres),
    vibes:            flattenTagGroup(vibes),
    influences:       flattenTagGroup(influences),
    covers_originals: coversOriginals ?? null,

    // ── Looking For ────────────────────────────────────────────────────────────
    opportunity_types: opportunityTypes ?? [],
    commitment:        commitment       ?? null,
    availability:      availability     ?? [],
    travel_radius:     travelRadius     ?? null,
    paid_status:       paidStatus       ?? null,

    // ── Links & Media ──────────────────────────────────────────────────────────
    featured_link:       trimOrNull(featuredLink),
    audio_link:          trimOrNull(audioLink),
    video_link:          trimOrNull(videoLink),
    instagram:           trimOrNull(instagram),
    youtube:             trimOrNull(youtube),
    spotify_or_website:  trimOrNull(spotifyOrWebsite),

    // ── Listing Preferences ────────────────────────────────────────────────────
    listing_status:      listingStatus      ?? null,
    open_to:             openTo             ?? [],
    collaboration_scope: collaborationScope ?? null,
  };
}
