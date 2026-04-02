/**
 * mockCreateJamOptions.js
 *
 * Centralized option sets for the Create Jam form.
 * All options follow the OptionItem shape:
 *   { id, label, value, icon?, colorToken?, isUniversalOption? }
 *
 * Future: replace `createJamOptions` with a backend fetch call inside a
 * useCreateJamOptions() hook. The form consumes this as: options={createJamOptions}
 * — no other changes required in the form components.
 */

// ─── Genres ───────────────────────────────────────────────────────────────────

export const genres = [
  { id: "rock",       label: "Rock",         value: "rock" },
  { id: "rnb",        label: "R&B",          value: "rnb" },
  { id: "jazz",       label: "Jazz",         value: "jazz" },
  { id: "blues",      label: "Blues",        value: "blues" },
  { id: "funk",       label: "Funk",         value: "funk" },
  { id: "neo-soul",   label: "Neo Soul",     value: "neo-soul" },
  { id: "hip-hop",    label: "Hip-Hop",      value: "hip-hop" },
  { id: "latin",      label: "Latin",        value: "latin" },
  { id: "pop",        label: "Pop",          value: "pop" },
  { id: "indie",      label: "Indie",        value: "indie" },
  { id: "electronic", label: "Electronic",   value: "electronic" },
  { id: "reggae",     label: "Reggae",       value: "reggae" },
  { id: "classical",  label: "Classical",    value: "classical" },
  { id: "country",    label: "Country",      value: "country" },
];

// ─── Vibes ────────────────────────────────────────────────────────────────────

export const vibes = [
  { id: "casual",            label: "Casual / Chill",       value: "casual" },
  { id: "serious",           label: "Serious / Focused",    value: "serious" },
  { id: "experimental",      label: "Experimental",         value: "experimental" },
  { id: "beginner-friendly", label: "Beginner Friendly",    value: "beginner-friendly" },
  { id: "performance",       label: "Performance Prep",     value: "performance" },
  { id: "freestyle",         label: "Freestyle Jam",        value: "freestyle" },
  { id: "high-energy",       label: "High Energy",          value: "high-energy" },
  { id: "intimate",          label: "Intimate / Small",     value: "intimate" },
];

// ─── Instruments ──────────────────────────────────────────────────────────────

export const instruments = [
  { id: "guitar",    label: "Guitar",    value: "guitar",    icon: "🎸" },
  { id: "bass",      label: "Bass",      value: "bass",      icon: "🎸" },
  { id: "drums",     label: "Drums",     value: "drums",     icon: "🥁" },
  { id: "keys",      label: "Keys",      value: "keys",      icon: "🎹" },
  { id: "vocals",    label: "Vocals",    value: "vocals",    icon: "🎤" },
  { id: "saxophone", label: "Saxophone", value: "saxophone", icon: "🎷" },
  { id: "trumpet",   label: "Trumpet",   value: "trumpet",   icon: "🎺" },
  { id: "violin",    label: "Violin",    value: "violin",    icon: "🎻" },
  { id: "dj",        label: "DJ",        value: "dj",        icon: "🎧" },
  { id: "producer",  label: "Producer",  value: "producer",  icon: "💻" },
  { id: "flute",     label: "Flute",     value: "flute",     icon: "🪈" },
];

// ─── Skill Levels ─────────────────────────────────────────────────────────────

export const skillLevels = [
  { id: "beginner",     label: "Beginner",     value: "beginner" },
  { id: "intermediate", label: "Intermediate", value: "intermediate" },
  { id: "advanced",     label: "Advanced",     value: "advanced" },
  { id: "pro",          label: "Professional", value: "pro" },
];

// ─── Jam Types ────────────────────────────────────────────────────────────────

export const jamTypes = [
  { id: "open-jam",     label: "Open Jam",            value: "open-jam" },
  { id: "band-practice",label: "Band Practice",       value: "band-practice" },
  { id: "songwriting",  label: "Songwriting Session", value: "songwriting" },
  { id: "recording",    label: "Recording Session",   value: "recording" },
  { id: "performance",  label: "Live Performance",    value: "performance" },
  { id: "workshop",     label: "Workshop",            value: "workshop" },
];

// ─── Roles ────────────────────────────────────────────────────────────────────

export const roles = [
  { id: "lead-guitarist",   label: "Lead Guitarist",   value: "lead-guitarist" },
  { id: "rhythm-guitarist", label: "Rhythm Guitarist", value: "rhythm-guitarist" },
  { id: "bassist",          label: "Bassist",          value: "bassist" },
  { id: "drummer",          label: "Drummer",          value: "drummer" },
  { id: "vocalist",         label: "Vocalist",         value: "vocalist" },
  { id: "backing-vocalist", label: "Backing Vocalist", value: "backing-vocalist" },
  { id: "keyboardist",      label: "Keyboardist",      value: "keyboardist" },
  { id: "saxophonist",      label: "Saxophonist",      value: "saxophonist" },
  { id: "trumpeter",        label: "Trumpeter",        value: "trumpeter" },
  { id: "violinist",        label: "Violinist",        value: "violinist" },
  { id: "dj",               label: "DJ",               value: "dj" },
  { id: "producer",         label: "Producer",         value: "producer" },
  { id: "sound-engineer",   label: "Sound Engineer",   value: "sound-engineer" },
  { id: "beat-maker",       label: "Beat Maker",       value: "beat-maker" },
  { id: "mc",               label: "MC / Host",        value: "mc" },
];

// ─── Equipment Available at Jam ───────────────────────────────────────────────

export const equipmentAvailable = [
  { id: "guitar-amp",       label: "Guitar Amp",       value: "guitar-amp" },
  { id: "bass-amp",         label: "Bass Amp",         value: "bass-amp" },
  { id: "pa-system",        label: "PA System",        value: "pa-system" },
  { id: "mixer",            label: "Mixer",            value: "mixer" },
  { id: "mics",             label: "Mics",             value: "mics" },
  { id: "mic-stands",       label: "Mic Stands",       value: "mic-stands" },
  { id: "cables",           label: "Cables",           value: "cables" },
  { id: "power-strips",     label: "Power Strips",     value: "power-strips" },
  { id: "drum-kit",         label: "Drum Kit",         value: "drum-kit" },
  { id: "keyboard-stand",   label: "Keyboard Stand",   value: "keyboard-stand" },
  { id: "di-box",           label: "DI Box",           value: "di-box" },
  { id: "monitor-speakers", label: "Monitor Speakers", value: "monitor-speakers" },
  { id: "audio-interface",  label: "Audio Interface",  value: "audio-interface" },
  { id: "recording-setup",  label: "Recording Setup",  value: "recording-setup" },
];

// ─── Equipment to Bring ───────────────────────────────────────────────────────

export const equipmentNeeded = [
  { id: "amp",               label: "Amp",              value: "amp" },
  { id: "mic",               label: "Mic",              value: "mic" },
  { id: "xlr-cable",         label: "XLR Cable",        value: "xlr-cable" },
  { id: "instrument-cable",  label: "Instrument Cable", value: "instrument-cable" },
  { id: "extension-cord",    label: "Extension Cord",   value: "extension-cord" },
  { id: "drumsticks",        label: "Drumsticks",       value: "drumsticks" },
  { id: "pedalboard",        label: "Pedalboard",       value: "pedalboard" },
  { id: "di-box",            label: "DI Box",           value: "di-box" },
  { id: "keyboard",          label: "Keyboard / Synth", value: "keyboard" },
  { id: "laptop",            label: "Laptop",           value: "laptop" },
  { id: "audio-interface",   label: "Audio Interface",  value: "audio-interface" },
  { id: "headphones",        label: "Headphones",       value: "headphones" },
];

// ─── Aggregated option set ────────────────────────────────────────────────────
// This is the single object passed to CreateJamForm as: options={createJamOptions}
// Later: const createJamOptions = await fetchCreateJamOptions();

export const createJamOptions = {
  genres,
  vibes,
  instruments,
  skillLevels,
  jamTypes,
  roles,
  equipmentAvailable,
  equipmentNeeded,
};
