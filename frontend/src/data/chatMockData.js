export const currentUser = {
  id: "u0", name: "Jordan M.",
  avatar: "https://i.pravatar.cc/150?u=u0",
  status: "online", instruments: ["Drums"]
}

export const users = [
  { id: "u1", name: "Alex R.",  avatar: "https://i.pravatar.cc/150?u=u1", status: "online" },
  { id: "u2", name: "Maya K.",  avatar: "https://i.pravatar.cc/150?u=u2", status: "away"   },
  { id: "u3", name: "Chris B.", avatar: "https://i.pravatar.cc/150?u=u3", status: "online" },
]

export const dmThreads = [
  { id: "dm1", type: "dm", participantId: "u1", unread: 0 },
  { id: "dm2", type: "dm", participantId: "u2", unread: 2 },
  { id: "dm3", type: "dm", participantId: "u3", unread: 0 },
]

export const jamThreads = [
  { id: "jt1", type: "jam", name: "The Basement Jam",    active: true,  memberCount: 4, onlineCount: 2, jamId: "j1" },
  { id: "jt2", type: "jam", name: "Indie Rock Collab",   active: false, memberCount: 6, onlineCount: 1, jamId: "j2" },
  { id: "jt3", type: "jam", name: "Jazz Fusion Project", active: false, memberCount: 3, onlineCount: 0, jamId: "j3" },
]

// Generate stable waveform bars (called once, not in render)
const makeWave = () =>
  Array.from({ length: 40 }, () => parseFloat((0.2 + Math.random() * 0.8).toFixed(2)))

export const messagesByThread = {
  jt1: [
    { id: "m1", senderId: "u1", type: "text",
      content: "Hey, check out this new bassline I recorded.",
      timestamp: "2:41 PM" },
    { id: "m2", senderId: "u1", type: "audio",
      filename: "Groove_Sketch_v3.wav", duration: "0:32",
      waveformBars: makeWave(), timestamp: "2:41 PM" },
    { id: "m3", senderId: "u0", type: "text",
      content: "Sounds sick! I'll lay down some drums on it tonight.",
      timestamp: "2:43 PM" },
    { id: "m4", senderId: "u2", type: "audio",
      filename: null, duration: "0:45",
      waveformBars: makeWave(), timestamp: "2:44 PM" },
  ],
  dm1: [
    { id: "dm1m1", senderId: "u1", type: "text",
      content: "Yo, you free to jam this weekend?", timestamp: "1:10 PM" },
    { id: "dm1m2", senderId: "u0", type: "text",
      content: "Saturday works for me!", timestamp: "1:12 PM" },
  ],
  dm2: [
    { id: "dm2m1", senderId: "u2", type: "text",
      content: "I uploaded the new track, check your files.",
      timestamp: "Yesterday" },
  ],
  dm3: [],
}

export const jams = {
  j1: {
    id: "j1", name: "The Basement Jam",
    genre: ["Hip-Hop", "R&B"], bpm: 92, key: "Dm",
    memberIds: ["u0", "u1", "u2", "u3"],
    description: "Late-night groove sessions. All bassheads welcome.",
  },
  j2: {
    id: "j2", name: "Indie Rock Collab",
    genre: ["Indie", "Rock"], bpm: 118, key: "G",
    memberIds: ["u0", "u1", "u2", "u3", "u4", "u5"],
    description: "Crafting layered soundscapes. Guitarists and keys welcome.",
  },
  j3: {
    id: "j3", name: "Jazz Fusion Project",
    genre: ["Jazz", "Fusion"], bpm: 104, key: "Eb",
    memberIds: ["u0", "u2", "u3"],
    description: "Complex harmony, open improv. Bring your A game.",
  },
}
