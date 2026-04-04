/**
 * mockFindBandmateOptions.js
 *
 * Option sets for the Find a Bandmate form (band/project recruitment listing).
 * All options follow the OptionItem shape: { id, label, value }
 *
 * Future: replace with a backend fetch call inside a useFindBandmateOptions() hook.
 *
 * Genres, instruments, and vibes are shared — imported from mockCreateJamOptions,
 * not duplicated here.
 */

import { genres, instruments, vibes } from "./mockCreateJamOptions";

// ─── Re-export shared lists so callers can import from one place ──────────────
export { genres, instruments, vibes };

// ─── Roles needed ─────────────────────────────────────────────────────────────

export const rolesNeeded = [
  { id: "drummer",        label: "Drummer",        value: "drummer" },
  { id: "guitarist",      label: "Guitarist",      value: "guitarist" },
  { id: "bassist",        label: "Bassist",        value: "bassist" },
  { id: "vocalist",       label: "Vocalist",       value: "vocalist" },
  { id: "keyboardist",    label: "Keyboardist",    value: "keyboardist" },
  { id: "producer",       label: "Producer",       value: "producer" },
  { id: "dj",             label: "DJ",             value: "dj" },
  { id: "saxophonist",    label: "Saxophonist",    value: "saxophonist" },
  { id: "trumpeter",      label: "Trumpeter",      value: "trumpeter" },
  { id: "sound-engineer", label: "Sound Engineer", value: "sound-engineer" },
];

// ─── Current lineup (who's already in the project) ───────────────────────────

export const lineupRoles = [
  { id: "guitar",    label: "Guitar",    value: "guitar" },
  { id: "bass",      label: "Bass",      value: "bass" },
  { id: "drums",     label: "Drums",     value: "drums" },
  { id: "vocals",    label: "Vocals",    value: "vocals" },
  { id: "keys",      label: "Keys",      value: "keys" },
  { id: "producer",  label: "Producer",  value: "producer" },
  { id: "saxophone", label: "Saxophone", value: "saxophone" },
  { id: "trumpet",   label: "Trumpet",   value: "trumpet" },
  { id: "dj",        label: "DJ",        value: "dj" },
  { id: "strings",   label: "Strings",   value: "strings" },
  { id: "horns",     label: "Horns",     value: "horns" },
];

// ─── Availability ─────────────────────────────────────────────────────────────

export const availability = [
  { id: "weekday-mornings", label: "Weekday Mornings", value: "weekday-mornings" },
  { id: "weekday-evenings", label: "Weekday Evenings", value: "weekday-evenings" },
  { id: "weekends",         label: "Weekends",         value: "weekends" },
  { id: "flexible",         label: "Flexible",         value: "flexible" },
];

// ─── Skill level desired (what the opening needs) ─────────────────────────────

export const skillLevelsDesired = [
  { id: "beginner-friendly", label: "Beginner-friendly", value: "beginner-friendly" },
  { id: "intermediate",      label: "Intermediate",      value: "intermediate" },
  { id: "advanced",          label: "Advanced",          value: "advanced" },
  { id: "mixed",             label: "Mixed / Open",      value: "mixed" },
];

// ─── Project level (overall experience level of the project) ─────────────────

export const projectLevels = [
  { id: "beginner-friendly", label: "Beginner-friendly", value: "beginner-friendly" },
  { id: "intermediate",      label: "Intermediate",      value: "intermediate" },
  { id: "advanced",          label: "Advanced",          value: "advanced" },
  { id: "mixed",             label: "Mixed",             value: "mixed" },
];

// ─── Covers / Originals ───────────────────────────────────────────────────────

export const coversOriginals = [
  { id: "originals",     label: "Originals",      value: "originals" },
  { id: "covers",        label: "Covers",         value: "covers" },
  { id: "both",          label: "Both",           value: "both" },
  { id: "open-to-either", label: "Open to Either", value: "open-to-either" },
];

// ─── Commitment level ─────────────────────────────────────────────────────────

export const commitmentLevels = [
  { id: "casual-jams",       label: "Casual Jams",       value: "casual-jams" },
  { id: "weekly-rehearsals", label: "Weekly Rehearsals",  value: "weekly-rehearsals" },
  { id: "serious-project",   label: "Serious Project",    value: "serious-project" },
  { id: "gig-ready",         label: "Gig-Ready",          value: "gig-ready" },
  { id: "studio-focused",    label: "Studio-Focused",     value: "studio-focused" },
  { id: "long-term-band",    label: "Long-Term Band Build", value: "long-term-band" },
];

// ─── Aggregated option set ────────────────────────────────────────────────────

export const findBandmateOptions = {
  genres,
  instruments,
  vibes,
  lineupRoles,
  rolesNeeded,
  availability,
  skillLevelsDesired,
  projectLevels,
  coversOriginals,
  commitmentLevels,
};
