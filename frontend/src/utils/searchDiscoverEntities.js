/**
 * searchDiscoverEntities — unified search index + query engine for the Discover page.
 *
 * Design: backend-swappable. normalizeDiscoverItems maps current mock data into
 * SearchResult objects. Later a real API response can be mapped through the same
 * shape without changing any UI component.
 *
 * SearchResult shape:
 *   id             string
 *   type           'jam' | 'show' | 'musician' | 'band' | 'location'
 *   title          string
 *   subtitle?      string
 *   keywords       string[]          — all searchable text, lowercased
 *   neighborhood?  string
 *   coordinates?   { latitude: number, longitude: number }
 *   sourcePinId?   string            — maps to mockDiscoveryFeed id (for map sync)
 *   relevanceScore number
 */

const ENTITY_TYPE_MAP = {
  jam: "jam",
  promote_show: "show",
  join_band: "musician",
  find_bandmate: "band",
};

// ── Miami neighborhoods / places for location search ──────────────────────────
// Expand later with a real geocoding API; swap by replacing this array.
export const MIAMI_LOCATIONS = [
  {
    id: "loc-wynwood",
    title: "Wynwood",
    subtitle: "Miami arts district",
    neighborhood: "Wynwood",
    coordinates: { latitude: 25.8008, longitude: -80.1985 },
  },
  {
    id: "loc-brickell",
    title: "Brickell",
    subtitle: "Miami financial district",
    neighborhood: "Brickell",
    coordinates: { latitude: 25.7617, longitude: -80.1943 },
  },
  {
    id: "loc-little-havana",
    title: "Little Havana",
    subtitle: "Historic Miami neighborhood",
    neighborhood: "Little Havana",
    coordinates: { latitude: 25.7659, longitude: -80.2278 },
  },
  {
    id: "loc-coconut-grove",
    title: "Coconut Grove",
    subtitle: "Miami waterfront neighborhood",
    neighborhood: "Coconut Grove",
    coordinates: { latitude: 25.7285, longitude: -80.2419 },
  },
  {
    id: "loc-downtown-miami",
    title: "Downtown Miami",
    subtitle: "Miami city center",
    neighborhood: "Downtown Miami",
    coordinates: { latitude: 25.7745, longitude: -80.1977 },
  },
  {
    id: "loc-north-miami",
    title: "North Miami",
    subtitle: "Miami-Dade neighborhood",
    neighborhood: "North Miami",
    coordinates: { latitude: 25.8901, longitude: -80.1864 },
  },
  {
    id: "loc-kendall",
    title: "Kendall",
    subtitle: "Miami-Dade suburb",
    neighborhood: "Kendall",
    coordinates: { latitude: 25.6869, longitude: -80.3168 },
  },
  {
    id: "loc-south-beach",
    title: "South Beach",
    subtitle: "Miami Beach",
    neighborhood: "South Beach",
    coordinates: { latitude: 25.7907, longitude: -80.1300 },
  },
  {
    id: "loc-design-district",
    title: "Design District",
    subtitle: "Miami arts & design",
    neighborhood: "Design District",
    coordinates: { latitude: 25.8134, longitude: -80.1951 },
  },
  {
    id: "loc-overtown",
    title: "Overtown",
    subtitle: "Historic Miami neighborhood",
    neighborhood: "Overtown",
    coordinates: { latitude: 25.7867, longitude: -80.2030 },
  },
];

// ── Normalization ──────────────────────────────────────────────────────────────

const normalizeItem = (item) => {
  const type = ENTITY_TYPE_MAP[item.type] ?? "jam";

  const keywords = [
    item.title,
    item.subtitle,
    item.neighborhood,
    item.description,
    item.venueName,
    item.musicianName,
    item.bandName,
    item.primaryInstrument,
    item.neededRole,
    item.recruitingNote,
    item.metaPrimary,
    item.metaSecondary,
    ...(item.tags ?? []),
    ...(item.genres ?? []),
    ...(item.vibes ?? []),
    ...(item.instruments ?? []),
    ...(item.lookingFor ?? []),
    ...(item.detailRows?.map((r) => r.value) ?? []),
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const coords =
    item.coordinates ??
    item.approximateCoordinates ??
    (item.lat != null ? { latitude: item.lat, longitude: item.lng } : null);

  return {
    id: item.id,
    type,
    title: item.title,
    subtitle: item.subtitle ?? item.metaSecondary ?? null,
    keywords,
    neighborhood: item.neighborhood ?? null,
    coordinates: coords,
    sourcePinId: item.id,
    relevanceScore: 0,
  };
};

const normalizeLocation = (loc) => ({
  id: loc.id,
  type: "location",
  title: loc.title,
  subtitle: loc.subtitle,
  keywords: [loc.title.toLowerCase(), loc.neighborhood?.toLowerCase()].filter(Boolean),
  neighborhood: loc.neighborhood,
  coordinates: loc.coordinates,
  sourcePinId: null,
  relevanceScore: 0,
});

// ── Scoring ────────────────────────────────────────────────────────────────────
//
// Tiers (additive):
//   40 — full query matches title exactly
//   30 — title starts with full query
//   20 — title contains full query
//   15 — title contains an individual token
//    8 — keyword matches full query exactly
//    5 — keyword starts with full query
//    3 — keyword contains individual token
//    5 — neighborhood contains full query (bonus)

const scoreResult = (result, tokens) => {
  const titleLower = result.title.toLowerCase();
  const fullQuery = tokens.join(" ");
  let score = 0;

  if (titleLower === fullQuery) {
    score += 40;
  } else if (titleLower.startsWith(fullQuery)) {
    score += 30;
  } else if (titleLower.includes(fullQuery)) {
    score += 20;
  } else {
    for (const t of tokens) {
      if (titleLower.includes(t)) score += 15;
    }
  }

  for (const kw of result.keywords) {
    if (kw === fullQuery) {
      score += 8;
    } else if (kw.startsWith(fullQuery)) {
      score += 5;
    } else {
      for (const t of tokens) {
        if (kw.includes(t)) score += 3;
      }
    }
  }

  if (result.neighborhood?.toLowerCase().includes(fullQuery)) {
    score += 5;
  }

  return score;
};

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build normalized search indexes from current discovery items.
 * Call once per items change and cache. Backend-swappable: replace discoveryItems
 * with your API results and normalizeItem handles the rest.
 */
export const buildSearchIndex = (discoveryItems) => {
  const pinEntities = discoveryItems.map(normalizeItem);
  const locationEntities = MIAMI_LOCATIONS.map(normalizeLocation);
  return { pinEntities, locationEntities };
};

/**
 * Search the index and return grouped results.
 *
 * Returns:
 *   {
 *     pins:      SearchResult[]   — jams, shows, musicians, bands (max 6)
 *     locations: SearchResult[]   — nearby places (max 4)
 *   }
 */
export const searchDiscoverEntities = (query, { pinEntities, locationEntities }) => {
  const q = query.trim().toLowerCase();
  if (!q) return { pins: [], locations: [] };

  const tokens = q.split(/\s+/).filter(Boolean);

  const scoreAndFilter = (items) =>
    items
      .map((item) => ({ ...item, relevanceScore: scoreResult(item, tokens) }))
      .filter((item) => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    pins: scoreAndFilter(pinEntities).slice(0, 6),
    locations: scoreAndFilter(locationEntities).slice(0, 4),
  };
};
