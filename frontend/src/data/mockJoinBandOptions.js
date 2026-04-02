/**
 * mockJoinBandOptions.js
 *
 * Option sets for the Join a Band form.
 * All options follow the OptionItem shape: { id, label, value }
 *
 * Future: replace with a backend fetch call inside a useJoinBandOptions() hook.
 *
 * Genres, instruments, and vibes are shared — imported from mockCreateJamOptions,
 * not duplicated here.
 */

import { genres, instruments, vibes } from "./mockCreateJamOptions";

// ─── Re-export shared lists so callers can import from one place ──────────────
export { genres, instruments, vibes };

// ─── Roles needed ─────────────────────────────────────────────────────────────

export const rolesNeeded = [
  { id: "lead-guitarist",   label: "Lead Guitarist",   value: "lead-guitarist" },
  { id: "rhythm-guitarist", label: "Rhythm Guitarist", value: "rhythm-guitarist" },
  { id: "bassist",          label: "Bassist",          value: "bassist" },
  { id: "drummer",          label: "Drummer",          value: "drummer" },
  { id: "vocalist",         label: "Vocalist",         value: "vocalist" },
  { id: "backing-vocalist", label: "Backing Vocalist", value: "backing-vocalist" },
  { id: "keyboardist",      label: "Keyboardist",      value: "keyboardist" },
  { id: "saxophonist",      label: "Saxophonist",      value: "saxophonist" },
  { id: "trumpeter",        label: "Trumpeter",        value: "trumpeter" },
  { id: "dj",               label: "DJ",               value: "dj" },
  { id: "producer",         label: "Producer",         value: "producer" },
  { id: "sound-engineer",   label: "Sound Engineer",   value: "sound-engineer" },
  { id: "beat-maker",       label: "Beat Maker",       value: "beat-maker" },
];

// ─── Skill levels ─────────────────────────────────────────────────────────────

export const skillLevels = [
  { id: "beginner",     label: "Beginner",     value: "beginner" },
  { id: "intermediate", label: "Intermediate", value: "intermediate" },
  { id: "advanced",     label: "Advanced",     value: "advanced" },
  { id: "any",          label: "Any",          value: "any" },
];

// ─── Aggregated option set ────────────────────────────────────────────────────

export const joinBandOptions = {
  genres,
  instruments,
  vibes,
  rolesNeeded,
  skillLevels,
};
