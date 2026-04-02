/**
 * mockFindBandmateOptions.js
 *
 * Option sets for the Find a Bandmate form.
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

// ─── Roles seeking ────────────────────────────────────────────────────────────

export const rolesSeeking = [
  { id: "drummer",          label: "Drummer",          value: "drummer" },
  { id: "guitarist",        label: "Guitarist",        value: "guitarist" },
  { id: "bassist",          label: "Bassist",          value: "bassist" },
  { id: "vocalist",         label: "Vocalist",         value: "vocalist" },
  { id: "keyboardist",      label: "Keyboardist",      value: "keyboardist" },
  { id: "producer",         label: "Producer",         value: "producer" },
  { id: "dj",               label: "DJ",               value: "dj" },
  { id: "saxophonist",      label: "Saxophonist",      value: "saxophonist" },
  { id: "trumpeter",        label: "Trumpeter",        value: "trumpeter" },
  { id: "sound-engineer",   label: "Sound Engineer",   value: "sound-engineer" },
];

// ─── Availability ─────────────────────────────────────────────────────────────

export const availability = [
  { id: "weekday-mornings",  label: "Weekday Mornings",  value: "weekday-mornings" },
  { id: "weekday-evenings",  label: "Weekday Evenings",  value: "weekday-evenings" },
  { id: "weekends",          label: "Weekends",          value: "weekends" },
  { id: "flexible",          label: "Flexible",          value: "flexible" },
];

// ─── Skill levels ─────────────────────────────────────────────────────────────

export const skillLevels = [
  { id: "beginner",     label: "Beginner",     value: "beginner" },
  { id: "intermediate", label: "Intermediate", value: "intermediate" },
  { id: "advanced",     label: "Advanced",     value: "advanced" },
];

// ─── Aggregated option set ────────────────────────────────────────────────────

export const findBandmateOptions = {
  genres,
  instruments,
  vibes,
  rolesSeeking,
  availability,
  skillLevels,
};
