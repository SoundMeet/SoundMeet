/**
 * mockJams — single source of truth for all jam data on the Discover page.
 *
 * Data shape per jam:
 * ─────────────────────────────────────────────────────────────────────────
 * Display fields (shown on card):
 *   title           {string}    Jam name
 *   genre           {string}    Primary genre label (shown in subtitle)
 *   distanceMiles   {number}    Distance in miles
 *   dateTime        {string}    "Live Now" | "Tonight · 9:00 PM" | etc.
 *   isLive          {boolean}
 *   isPrivate       {boolean}
 *   image           {string?}   Thumbnail URL (null until real assets exist)
 *   tags            {string[]}  Display pills on the card. Pre-computed for
 *                               each jam — curated from jamType, vibe, genre
 *                               variants, and acceptsAll flags. Uppercase.
 *
 * Rich fields (used by filters, map pins, modals):
 *   genres          {string[]}  All genre tags
 *   vibes           {string[]}  Vibe descriptors
 *   instruments     {string[]}  Instruments the host is looking for
 *   jamType         {string}    Type of session (Improv, Open Jam, etc.)
 *   acceptsAllGenres     {boolean}
 *   acceptsAllVibes      {boolean}
 *   acceptsAllInstruments {boolean}
 *
 * Session metadata:
 *   hostName, locationName, lat, lng, description,
 *   capacity, attendeeCount, skillLevel, activityScore, timeSlot
 * ─────────────────────────────────────────────────────────────────────────
 * TODO: replace with real API data when backend is ready.
 */
export const mockJams = [
  // ── STRESS TEST: very long title ────────────────────────────────────────
  {
    id: "jam-000",
    title: "Late Night Wynwood Underground",
    genre: "Electronic",
    distanceMiles: 0.3,
    dateTime: "Tonight · 11:30 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    coverImageUrl: "https://picsum.photos/seed/jam000/400/400",
    tags: ["TECHNO", "AMBIENT", "DRONE", "MODULAR SYNTH", "NOISE", "FREEFORM", "NO LIMITS"],
    // Rich fields
    genres: ["Electronic", "Techno", "Ambient", "Noise"],
    vibes: ["Experimental", "Late Night", "No Rules"],
    instruments: ["Producer", "DJ", "Synth"],
    jamType: "Improv",
    acceptsAllGenres: false,
    acceptsAllVibes: true,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Arlo F.",
    locationName: "Wynwood Walls Area",
    lat: 25.8007,
    lng: -80.1994,
    description: "Deep electronic improvisation in the heart of Wynwood. Modular synths, field recordings, and pure experimentation. Leave your expectations at the door.",
    capacity: 6,
    attendeeCount: 3,
    skillLevel: "Open",
    activityScore: 62,
    timeSlot: "tonight",
  },

  // ── STRESS TEST: many pills + open / all-accepted ────────────────────────
  {
    id: "jam-009",
    title: "Wynwood Open Groove",
    genre: "Eclectic",
    distanceMiles: 0.4,
    dateTime: "Tomorrow · 8:00 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    tags: ["ALL GENRES", "ALL INSTRUMENTS", "BEGINNER OK", "OPEN JAM", "CHILL VIBES", "DROP IN", "NO AUDITION"],
    // Rich fields
    genres: [],
    vibes: ["Casual", "Beginner Friendly"],
    instruments: [],
    jamType: "Open Jam",
    acceptsAllGenres: true,
    acceptsAllVibes: false,
    acceptsAllInstruments: true,
    // Meta
    hostName: "Mia R.",
    locationName: "Wynwood",
    lat: 25.7993,
    lng: -80.1991,
    description: "Truly open session — any genre, any instrument, any level. We play until it feels right. Drop in whenever.",
    capacity: 20,
    attendeeCount: 4,
    skillLevel: "Open",
    activityScore: 38,
    timeSlot: "tomorrow",
  },

  // ── PRIMARY JAMS ────────────────────────────────────────────────────────
  {
    id: "jam-001",
    title: "The Jam Collective",
    genre: "Jazz Fusion",
    distanceMiles: 0.6,
    dateTime: "Live Now",
    isLive: true,
    isPrivate: false,
    image: null,
    tags: ["IMPROV", "BEBOP", "JAZZ FUSION"],
    // Rich fields
    genres: ["Jazz", "Fusion", "Bebop"],
    vibes: ["Serious", "Focused"],
    instruments: ["Saxophone", "Bass"],
    jamType: "Improv",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Marcus T.",
    locationName: "FIU Parking Garage 6",
    lat: 25.7526,
    lng: -80.3728,
    description: "Weekly jazz fusion session. All skill levels welcome. We run changes, then open improv. Bring your ears.",
    capacity: 12,
    attendeeCount: 7,
    skillLevel: "Open",
    activityScore: 85,
    timeSlot: "live",
  },
  {
    id: "jam-002",
    title: "Midnight Pocket",
    genre: "Neo Soul",
    distanceMiles: 1.1,
    dateTime: "Live Now",
    isLive: true,
    isPrivate: false,
    image: null,
    tags: ["GROOVE", "SOULFUL", "LATE NIGHT"],
    // Rich fields
    genres: ["Neo Soul", "R&B", "Funk"],
    vibes: ["Casual", "Intimate"],
    instruments: ["Keys", "Vocals"],
    jamType: "Open Jam",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Deja V.",
    locationName: "Little Haiti",
    lat: 25.8175,
    lng: -80.189,
    description: "Late-night neo soul vibes. Bring your groove and leave your ego. We play until it feels right.",
    capacity: 8,
    attendeeCount: 5,
    skillLevel: "Intermediate",
    activityScore: 72,
    timeSlot: "live",
  },
  {
    id: "jam-003",
    title: "Coral Gables Groove",
    genre: "Funk",
    distanceMiles: 2.3,
    dateTime: "Tonight · 9:00 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    tags: ["FUNK", "DANCE", "HIGH ENERGY", "POCKET"],
    // Rich fields
    genres: ["Funk", "Soul"],
    vibes: ["Freestyle", "High Energy"],
    instruments: ["Drums", "Bass", "Guitar"],
    jamType: "Improv",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Ray O.",
    locationName: "Coral Gables",
    lat: 25.7465,
    lng: -80.2592,
    description: "Heavy pocket funk. No sheet music, just feel. If you can lock in with the drummer, you're in.",
    capacity: 10,
    attendeeCount: 3,
    skillLevel: "Open",
    activityScore: 45,
    timeSlot: "tonight",
  },
  {
    id: "jam-004",
    title: "Little Havana Session",
    genre: "Latin",
    distanceMiles: 3.0,
    dateTime: "Tonight · 10:30 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    tags: ["SALSA", "LATIN JAZZ", "AFROBEAT"],
    // Rich fields
    genres: ["Latin", "Salsa", "Afrobeat"],
    vibes: ["Performance", "Energetic"],
    instruments: ["Trumpet", "Percussion"],
    jamType: "Rehearsal",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Carlos M.",
    locationName: "Calle Ocho",
    lat: 25.7726,
    lng: -80.2228,
    description: "Cuban jazz and salsa fusion on Calle Ocho. We run through standards and stretch them out. Dressy casual.",
    capacity: 15,
    attendeeCount: 9,
    skillLevel: "Intermediate",
    activityScore: 60,
    timeSlot: "tonight",
  },
  {
    id: "jam-005",
    title: "Brickell After Hours",
    genre: "R&B",
    distanceMiles: 1.8,
    dateTime: "Tonight · 11:00 PM",
    isLive: false,
    isPrivate: true,
    image: null,
    tags: ["RNB", "SMOOTH", "INVITE ONLY"],
    // Rich fields
    genres: ["R&B", "Soul"],
    vibes: ["Intimate", "Serious"],
    instruments: ["Vocals", "Keys"],
    jamType: "Gig Prep",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Simone K.",
    locationName: "Brickell",
    lat: 25.7617,
    lng: -80.1938,
    description: "Invite-only R&B session. Smooth, late-night energy. Small circle, high trust, good wine.",
    capacity: 6,
    attendeeCount: 4,
    skillLevel: "Advanced",
    activityScore: 66,
    timeSlot: "tonight",
  },
  {
    id: "jam-006",
    title: "Sunset Blues Circle",
    genre: "Blues",
    distanceMiles: 4.2,
    dateTime: "Tomorrow · 7:00 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    tags: ["BLUES", "12-BAR", "BEGINNER FRIENDLY"],
    // Rich fields
    genres: ["Blues", "Americana"],
    vibes: ["Casual", "Beginner Friendly"],
    instruments: ["Guitar", "Harmonica"],
    jamType: "Open Jam",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Tony W.",
    locationName: "South Beach",
    lat: 25.783,
    lng: -80.1345,
    description: "Open blues circle at the beach. Beginners especially welcome. We play the 12-bar, share tips, and have a good time.",
    capacity: 12,
    attendeeCount: 6,
    skillLevel: "Beginner",
    activityScore: 50,
    timeSlot: "tomorrow",
  },
  {
    id: "jam-007",
    title: "Coconut Grove Indie Jam",
    genre: "Indie Rock",
    distanceMiles: 2.7,
    dateTime: "Live Now",
    isLive: true,
    isPrivate: false,
    image: null,
    tags: ["INDIE", "ORIGINALS", "EXPERIMENTAL", "FULL BAND"],
    // Rich fields
    genres: ["Indie Rock", "Alternative", "Post-Rock"],
    vibes: ["Experimental", "Creative"],
    instruments: ["Guitar", "Drums"],
    jamType: "Songwriting",
    acceptsAllGenres: false,
    acceptsAllVibes: false,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Priya S.",
    locationName: "Coconut Grove",
    lat: 25.7302,
    lng: -80.2415,
    description: "Indie rock with original material. Songwriters welcome. We build arrangements on the spot — structured chaos.",
    capacity: 8,
    attendeeCount: 8,
    skillLevel: "Intermediate",
    activityScore: 95,
    timeSlot: "live",
  },
  {
    id: "jam-008",
    title: "Noise Garden Lab",
    genre: "Experimental",
    distanceMiles: 5.1,
    dateTime: "Tomorrow · 10:00 PM",
    isLive: false,
    isPrivate: false,
    image: null,
    tags: ["NOISE", "FREEFORM", "AMBIENT", "ELECTRONIC", "AVANT-GARDE"],
    // Rich fields
    genres: ["Experimental", "Ambient", "Noise"],
    vibes: ["Experimental", "Abstract"],
    instruments: ["Producer", "DJ"],
    jamType: "Improv",
    acceptsAllGenres: false,
    acceptsAllVibes: true,
    acceptsAllInstruments: false,
    // Meta
    hostName: "Arlo F.",
    locationName: "Design District",
    lat: 25.8088,
    lng: -80.1985,
    description: "Sound art and freeform improv. Leave your ego at the door. There are no wrong notes here, only wrong intentions.",
    capacity: 6,
    attendeeCount: 2,
    skillLevel: "Open",
    activityScore: 20,
    timeSlot: "tomorrow",
  },
];
