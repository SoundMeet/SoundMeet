// ─── GENRES ───────────────────────────────────────────────────────────────────
export const genreOptions = [
  { id: "rock", label: "Rock" },
  { id: "rnb", label: "R&B" },
  { id: "jazz", label: "Jazz" },
  { id: "blues", label: "Blues" },
  { id: "funk", label: "Funk" },
  { id: "neo-soul", label: "Neo Soul" },
  { id: "hip-hop", label: "Hip-Hop" },
  { id: "latin", label: "Latin" },
  { id: "pop", label: "Pop" },
  { id: "indie", label: "Indie" },
  { id: "electronic", label: "Electronic" },
  { id: "reggae", label: "Reggae" },
  { id: "classical", label: "Classical" },
  { id: "country", label: "Country" },
  { id: "soul", label: "Soul" },
  { id: "gospel", label: "Gospel" },
  { id: "afrobeats", label: "Afrobeats" },
  { id: "metal", label: "Metal" },
];

// ─── INSTRUMENTS ──────────────────────────────────────────────────────────────
export const instrumentOptions = [
  { id: "guitar", label: "Guitar" },
  { id: "bass", label: "Bass" },
  { id: "drums", label: "Drums" },
  { id: "keys", label: "Keys" },
  { id: "vocals", label: "Vocals" },
  { id: "saxophone", label: "Saxophone" },
  { id: "trumpet", label: "Trumpet" },
  { id: "violin", label: "Violin" },
  { id: "dj", label: "DJ" },
  { id: "producer", label: "Producer" },
  { id: "flute", label: "Flute" },
  { id: "cello", label: "Cello" },
  { id: "ukulele", label: "Ukulele" },
  { id: "banjo", label: "Banjo" },
  { id: "trombone", label: "Trombone" },
  { id: "harmonica", label: "Harmonica" },
];

// ─── VIBE (multi-select) ──────────────────────────────────────────────────────
export const vibeOptions = [
  { id: "casual", label: "Casual / Chill" },
  { id: "serious", label: "Serious / Focused" },
  { id: "experimental", label: "Experimental" },
  { id: "beginner-friendly", label: "Beginner Friendly" },
  { id: "performance", label: "Performance Prep" },
  { id: "freestyle", label: "Freestyle Jam" },
  { id: "high-energy", label: "High Energy" },
  { id: "intimate", label: "Intimate / Small" },
];

// ─── SKILL LEVEL (single select) ─────────────────────────────────────────────
export const skillLevelOptions = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "pro", label: "Professional" },
];

// ─── JAM TYPE (multi-select) ──────────────────────────────────────────────────
export const jamTypeOptions = [
  { id: "open-jam", label: "Open Jam" },
  { id: "band-practice", label: "Band Practice" },
  { id: "songwriting", label: "Songwriting Session" },
  { id: "recording", label: "Recording Session" },
  { id: "performance", label: "Live Performance" },
  { id: "workshop", label: "Workshop" },
];

// ─── ROLES NEEDED ─────────────────────────────────────────────────────────────
export const rolesOptions = [
  { id: "lead-guitarist", label: "Lead Guitarist" },
  { id: "rhythm-guitarist", label: "Rhythm Guitarist" },
  { id: "bassist", label: "Bassist" },
  { id: "drummer", label: "Drummer" },
  { id: "vocalist", label: "Vocalist" },
  { id: "backing-vocalist", label: "Backing Vocalist" },
  { id: "keyboardist", label: "Keyboardist" },
  { id: "saxophonist", label: "Saxophonist" },
  { id: "trumpeter", label: "Trumpeter" },
  { id: "violinist", label: "Violinist" },
  { id: "dj", label: "DJ" },
  { id: "producer", label: "Producer" },
  { id: "sound-engineer", label: "Sound Engineer" },
  { id: "beat-maker", label: "Beat Maker" },
  { id: "mc", label: "MC / Host" },
];

// ─── EQUIPMENT AVAILABLE AT JAM ───────────────────────────────────────────────
export const equipmentAvailableOptions = [
  { id: "guitar-amp", label: "Guitar Amp" },
  { id: "bass-amp", label: "Bass Amp" },
  { id: "pa-system", label: "PA System" },
  { id: "mixer", label: "Mixer" },
  { id: "mics", label: "Mics" },
  { id: "mic-stands", label: "Mic Stands" },
  { id: "cables", label: "Cables" },
  { id: "power-strips", label: "Power Strips" },
  { id: "drum-kit", label: "Drum Kit" },
  { id: "keyboard-stand", label: "Keyboard Stand" },
  { id: "di-box", label: "DI Box" },
  { id: "monitor-speakers", label: "Monitor Speakers" },
  { id: "audio-interface", label: "Audio Interface" },
  { id: "recording-setup", label: "Recording Setup" },
];

// ─── EQUIPMENT TO BRING ───────────────────────────────────────────────────────
export const equipmentNeededOptions = [
  { id: "amp", label: "Amp" },
  { id: "mic", label: "Mic" },
  { id: "xlr-cable", label: "XLR Cable" },
  { id: "instrument-cable", label: "Instrument Cable" },
  { id: "extension-cord", label: "Extension Cord" },
  { id: "drumsticks", label: "Drumsticks" },
  { id: "pedalboard", label: "Pedalboard" },
  { id: "di-box", label: "DI Box" },
  { id: "keyboard", label: "Keyboard / Synth" },
  { id: "laptop", label: "Laptop" },
  { id: "audio-interface", label: "Audio Interface" },
  { id: "headphones", label: "Headphones" },
];

// ─── PRIVACY OPTIONS ─────────────────────────────────────────────────────────
export const privacyOptions = [
  {
    id: "public",
    label: "Public",
    description: "Visible on the map. Anyone can join.",
  },
  {
    id: "private",
    label: "Private",
    description: "Hidden. Invite-only session.",
  },
];
