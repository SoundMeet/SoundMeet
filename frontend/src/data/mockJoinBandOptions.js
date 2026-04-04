/**
 * mockJoinBandOptions.js
 *
 * Option sets for the "Join a Band" musician profile form.
 * All options follow the OptionItem shape: { id, label, value }
 *
 * Future: replace with a backend fetch call inside a useJoinBandOptions() hook.
 *
 * Genres, instruments, and vibes are shared — imported from mockCreateJamOptions,
 * not duplicated here.
 */

import { genres, instruments, vibes } from "./mockCreateJamOptions";

export { genres, instruments, vibes };

// ─── Musician roles ───────────────────────────────────────────────────────────

export const roles = [
  { id: "lead-guitarist",        label: "Lead Guitarist",        value: "lead-guitarist" },
  { id: "rhythm-guitarist",      label: "Rhythm Guitarist",      value: "rhythm-guitarist" },
  { id: "bassist",               label: "Bassist",               value: "bassist" },
  { id: "drummer",               label: "Drummer",               value: "drummer" },
  { id: "vocalist",              label: "Vocalist",              value: "vocalist" },
  { id: "backing-vocalist",      label: "Backing Vocalist",      value: "backing-vocalist" },
  { id: "keyboardist",           label: "Keyboardist",           value: "keyboardist" },
  { id: "saxophonist",           label: "Saxophonist",           value: "saxophonist" },
  { id: "trumpeter",             label: "Trumpeter",             value: "trumpeter" },
  { id: "dj",                    label: "DJ",                    value: "dj" },
  { id: "producer",              label: "Producer",              value: "producer" },
  { id: "sound-engineer",        label: "Sound Engineer",        value: "sound-engineer" },
  { id: "beat-maker",            label: "Beat Maker",            value: "beat-maker" },
  { id: "multi-instrumentalist", label: "Multi-Instrumentalist", value: "multi-instrumentalist" },
];

// ─── Skill levels ─────────────────────────────────────────────────────────────

export const skillLevels = [
  { id: "beginner",     label: "Beginner",     value: "beginner" },
  { id: "intermediate", label: "Intermediate", value: "intermediate" },
  { id: "advanced",     label: "Advanced",     value: "advanced" },
  { id: "professional", label: "Professional", value: "professional" },
];

// ─── Years playing ────────────────────────────────────────────────────────────

export const yearsPlayingOptions = [
  { id: "under-1", label: "< 1 yr",   value: "under-1" },
  { id: "1-3",     label: "1–3 yrs",  value: "1-3" },
  { id: "3-5",     label: "3–5 yrs",  value: "3-5" },
  { id: "5-10",    label: "5–10 yrs", value: "5-10" },
  { id: "10-plus", label: "10+ yrs",  value: "10-plus" },
];

// ─── Experience types ─────────────────────────────────────────────────────────

export const experienceTypes = [
  { id: "live",        label: "Live Shows",  value: "live" },
  { id: "studio",      label: "Studio",      value: "studio" },
  { id: "songwriting", label: "Songwriting", value: "songwriting" },
  { id: "production",  label: "Production",  value: "production" },
  { id: "touring",     label: "Touring",     value: "touring" },
];

// ─── Vocal types ──────────────────────────────────────────────────────────────

export const vocalTypes = [
  { id: "none",    label: "None",    value: "none" },
  { id: "backing", label: "Backing", value: "backing" },
  { id: "lead",    label: "Lead",    value: "lead" },
  { id: "both",    label: "Both",    value: "both" },
];

// ─── Covers / Originals ───────────────────────────────────────────────────────

export const coversOriginalsOptions = [
  { id: "originals", label: "Originals",      value: "originals" },
  { id: "covers",    label: "Covers",         value: "covers" },
  { id: "both",      label: "Both",           value: "both" },
  { id: "open",      label: "Open to Either", value: "open" },
];

// ─── Project types ────────────────────────────────────────────────────────────

export const projectTypes = [
  { id: "original-band", label: "Original Band",   value: "original-band" },
  { id: "cover-band",    label: "Cover Band",      value: "cover-band" },
  { id: "tribute",       label: "Tribute Act",     value: "tribute" },
  { id: "gigging",       label: "Gigging Project", value: "gigging" },
  { id: "jam-oriented",  label: "Jam-Oriented",    value: "jam-oriented" },
  { id: "studio",        label: "Studio Project",  value: "studio" },
  { id: "experimental",  label: "Experimental",    value: "experimental" },
  { id: "session-work",  label: "Session Work",    value: "session-work" },
];

// ─── Opportunity types ────────────────────────────────────────────────────────

export const opportunityTypes = [
  { id: "join-band",     label: "Join a Band",          value: "join-band" },
  { id: "start-project", label: "Start a New Project",  value: "start-project" },
  { id: "session-work",  label: "Session Work",         value: "session-work" },
  { id: "live-gigs",     label: "Live Gigs",            value: "live-gigs" },
  { id: "studio-collab", label: "Studio Collaboration", value: "studio-collab" },
  { id: "casual-jams",   label: "Casual Jams",          value: "casual-jams" },
];

// ─── Commitment ───────────────────────────────────────────────────────────────

export const commitmentOptions = [
  { id: "casual",       label: "Casual",       value: "casual" },
  { id: "semi-serious", label: "Semi-Serious", value: "semi-serious" },
  { id: "serious",      label: "Serious",      value: "serious" },
  { id: "professional", label: "Professional", value: "professional" },
];

// ─── Availability ─────────────────────────────────────────────────────────────

export const availabilityOptions = [
  { id: "weekday-days",   label: "Weekday Days",   value: "weekday-days" },
  { id: "weekday-nights", label: "Weekday Nights", value: "weekday-nights" },
  { id: "weekends",       label: "Weekends",       value: "weekends" },
  { id: "flexible",       label: "Flexible",       value: "flexible" },
];

// ─── Travel radius ────────────────────────────────────────────────────────────

export const travelRadiusOptions = [
  { id: "5mi",      label: "5 mi",    value: "5mi" },
  { id: "10mi",     label: "10 mi",   value: "10mi" },
  { id: "25mi",     label: "25 mi",   value: "25mi" },
  { id: "50mi",     label: "50 mi",   value: "50mi" },
  { id: "100mi",    label: "100 mi",  value: "100mi" },
  { id: "no-limit", label: "No limit", value: "no-limit" },
];

// ─── Paid status ──────────────────────────────────────────────────────────────

export const paidStatusOptions = [
  { id: "paid",   label: "Paid only", value: "paid" },
  { id: "unpaid", label: "Unpaid OK", value: "unpaid" },
  { id: "either", label: "Either",    value: "either" },
];

// ─── Preferred contact ────────────────────────────────────────────────────────

export const preferredContactOptions = [
  { id: "in-app",    label: "SoundMeet messages", value: "in-app" },
  { id: "instagram", label: "Instagram",          value: "instagram" },
  { id: "email",     label: "Email",              value: "email" },
  { id: "any",       label: "Any",                value: "any" },
];

// ─── Listing status ───────────────────────────────────────────────────────────

export const listingStatusOptions = [
  { id: "actively-looking",      label: "Actively looking",          value: "actively-looking" },
  { id: "open-to-right-project", label: "Open to the right project", value: "open-to-right-project" },
  { id: "just-exploring",        label: "Just exploring",            value: "just-exploring" },
];

// ─── Open to (listing-level declaration) ─────────────────────────────────────

export const openToOptions = [
  { id: "join-band",     label: "Joining a band",        value: "join-band" },
  { id: "start-project", label: "Starting a new project", value: "start-project" },
];

// ─── Collaboration scope ──────────────────────────────────────────────────────

export const collaborationScopeOptions = [
  { id: "local-only",     label: "Local only",              value: "local-only" },
  { id: "local-remote",   label: "Local + remote",          value: "local-remote" },
  { id: "open-to-travel", label: "Open to travel / touring", value: "open-to-travel" },
];

// ─── Aggregated option set ────────────────────────────────────────────────────

export const joinBandOptions = {
  genres,
  instruments,
  vibes,
  roles,
  skillLevels,
  yearsPlayingOptions,
  experienceTypes,
  vocalTypes,
  coversOriginalsOptions,
  opportunityTypes,
  commitmentOptions,
  availabilityOptions,
  travelRadiusOptions,
  paidStatusOptions,
  listingStatusOptions,
  openToOptions,
  collaborationScopeOptions,
};
