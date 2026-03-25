// data
// GENRES
export const genreOptions = [
  { id: "rock", label: "Rock" },
  { id: "rnb", label: "RnB" },
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
];

// INSTRUMENTS
export const instrumentOptions = [
  { id: "guitar", label: "Guitar", icon: "🎸" },
  { id: "bass", label: "Bass", icon: "🎸" },
  { id: "drums", label: "Drums", icon: "🥁" },
  { id: "keys", label: "Keys", icon: "🎹" },
  { id: "vocals", label: "Vocals", icon: "🎤" },
  { id: "saxophone", label: "Saxophone", icon: "🎷" },
  { id: "trumpet", label: "Trumpet", icon: "🎺" },
  { id: "violin", label: "Violin", icon: "🎻" },
  { id: "dj", label: "DJ", icon: "🎧" },
  { id: "producer", label: "Producer", icon: "💻" },
];

// VIBE (single select)
export const vibeOptions = [
  { id: "casual", label: "Casual / Chill" },
  { id: "serious", label: "Serious / Focused" },
  { id: "experimental", label: "Experimental" },
  { id: "beginner-friendly", label: "Beginner Friendly" },
  { id: "performance", label: "Performance Prep" },
  { id: "freestyle", label: "Freestyle Jam" },
];

// SKILL LEVEL (single select)
export const skillLevelOptions = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "pro", label: "Professional" },
];

// JAM TYPE (optional but useful)
export const jamTypeOptions = [
  { id: "open-jam", label: "Open Jam" },
  { id: "band-practice", label: "Band Practice" },
  { id: "songwriting", label: "Songwriting Session" },
  { id: "recording", label: "Recording Session" },
  { id: "performance", label: "Live Performance" },
];

// PRIVACY OPTIONS (for toggle)
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