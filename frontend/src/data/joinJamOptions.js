/**
 * data/joinJamOptions.js
 *
 * Default option lists for the Join Jam form.
 * All options follow the TagOption shape: { id, label }
 *
 * These are fallbacks — the form prefers jam-specific data passed in via props
 * (e.g. jam.instrumentsNeeded, jam.rolesNeeded, jam.equipmentNeeded).
 * Replace or extend these by swapping to a backend fetch in the parent.
 */

// ─── Instruments ──────────────────────────────────────────────────────────────

export const defaultInstrumentOptions = [
  { id: "guitar",    label: "Guitar" },
  { id: "bass",      label: "Bass" },
  { id: "drums",     label: "Drums" },
  { id: "keys",      label: "Keys" },
  { id: "vocals",    label: "Vocals" },
  { id: "saxophone", label: "Saxophone" },
  { id: "trumpet",   label: "Trumpet" },
  { id: "violin",    label: "Violin" },
  { id: "dj",        label: "DJ" },
  { id: "producer",  label: "Producer" },
  { id: "flute",     label: "Flute" },
  { id: "cello",     label: "Cello" },
  { id: "ukulele",   label: "Ukulele" },
  { id: "banjo",     label: "Banjo" },
  { id: "harmonica", label: "Harmonica" },
];

// ─── Roles ────────────────────────────────────────────────────────────────────

export const defaultRoleOptions = [
  { id: "lead-guitarist",   label: "Lead Guitarist" },
  { id: "rhythm-guitarist", label: "Rhythm Guitarist" },
  { id: "bassist",          label: "Bassist" },
  { id: "drummer",          label: "Drummer" },
  { id: "vocalist",         label: "Vocalist" },
  { id: "backing-vocalist", label: "Backing Vocalist" },
  { id: "keyboardist",      label: "Keyboardist" },
  { id: "saxophonist",      label: "Saxophonist" },
  { id: "trumpeter",        label: "Trumpeter" },
  { id: "violinist",        label: "Violinist" },
  { id: "dj",               label: "DJ" },
  { id: "producer",         label: "Producer" },
  { id: "sound-engineer",   label: "Sound Engineer" },
  { id: "beat-maker",       label: "Beat Maker" },
];

// ─── Equipment attendees can offer to bring ───────────────────────────────────

export const defaultEquipmentOptions = [
  { id: "amp",              label: "Amp" },
  { id: "mic",              label: "Mic" },
  { id: "xlr-cable",        label: "XLR Cable" },
  { id: "instrument-cable", label: "Instrument Cable" },
  { id: "extension-cord",   label: "Extension Cord" },
  { id: "drumsticks",       label: "Drumsticks" },
  { id: "pedalboard",       label: "Pedalboard" },
  { id: "di-box",           label: "DI Box" },
  { id: "keyboard",         label: "Keyboard / Synth" },
  { id: "laptop",           label: "Laptop" },
  { id: "mixer",            label: "Mixer" },
  { id: "headphones",       label: "Headphones" },
  { id: "audio-interface",  label: "Audio Interface" },
];
