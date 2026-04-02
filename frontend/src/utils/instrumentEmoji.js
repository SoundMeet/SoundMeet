const FALLBACK_EMOJI_BY_TYPE = {
  join_band: "👤",
  find_bandmate: "👥",
};

const INSTRUMENT_GROUPS = [
  { emoji: "🎸", aliases: ["guitar", "lead guitar", "rhythm guitar", "electric guitar", "acoustic guitar", "guitarist"] },
  { emoji: "🎸", aliases: ["bass", "bass guitar", "bassist"] },
  { emoji: "🥁", aliases: ["drums", "drummer", "percussion", "percussionist"] },
  { emoji: "🎹", aliases: ["keys", "keyboard", "keyboardist", "piano", "pianist", "synth", "synthesizer"] },
  { emoji: "🎤", aliases: ["vocals", "vocal", "vocalist", "singer", "backing vocals", "lead vocals"] },
  { emoji: "🎷", aliases: ["sax", "saxophone", "saxophonist"] },
  { emoji: "🎺", aliases: ["trumpet", "trumpeter", "horn"] },
  { emoji: "🎻", aliases: ["violin", "violinist", "strings", "fiddle"] },
  { emoji: "🎛️", aliases: ["producer", "dj", "electronic", "electronic live set", "live electronics", "controller", "beatmaker", "modular synth"] },
];

export const normalizeInstrumentLabel = (input) =>
  String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const getInstrumentEmoji = (input, fallback = "🎵") => {
  const normalized = normalizeInstrumentLabel(input);
  if (!normalized) return fallback;

  const match = INSTRUMENT_GROUPS.find(({ aliases }) =>
    aliases.some((alias) => normalized.includes(alias))
  );

  return match?.emoji ?? fallback;
};

export const getPrimaryInstrumentForListing = (listing) => {
  if (!listing) return null;

  const candidates = [
    listing.primaryInstrument,
    listing.instrument,
    ...(Array.isArray(listing.instruments) ? listing.instruments : []),
  ].filter(Boolean);

  return candidates[0] ?? null;
};

export const getListingInstrumentEmoji = (listing) => {
  const primary = getPrimaryInstrumentForListing(listing);
  const fallback = FALLBACK_EMOJI_BY_TYPE[listing?.type] ?? "🎵";
  return getInstrumentEmoji(primary, fallback);
};
