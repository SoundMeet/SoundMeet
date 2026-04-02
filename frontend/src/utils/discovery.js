export const DISCOVERY_COLORS = {
  background: "#141414",
  jam: "#DC2E73",
  promote_show: "#F7C10D",
  join_band: "#8B5CF6",
  find_bandmate: "#14B8A6",
  genrePillRed: "#FB4040",
  text: "#FFFFFF",
};

export const DISCOVERY_VARIANTS = {
  jam: {
    label: "Jam",
    accentColor: DISCOVERY_COLORS.jam,
    ctaLabel: "Join the Jam",
    previewCtaLabel: "View Jam",
    markerMode: "exact",
    markerGlyph: "J",
  },
  promote_show: {
    label: "Show",
    accentColor: DISCOVERY_COLORS.promote_show,
    ctaLabel: "View Show",
    previewCtaLabel: "View Show",
    markerMode: "exact",
    markerGlyph: "S",
  },
  join_band: {
    label: "Join Band",
    accentColor: DISCOVERY_COLORS.join_band,
    ctaLabel: "Join Band",
    previewCtaLabel: "View Band",
    markerMode: "approximate",
    markerGlyph: "B",
  },
  find_bandmate: {
    label: "Find Bandmate",
    accentColor: DISCOVERY_COLORS.find_bandmate,
    ctaLabel: "View Need",
    previewCtaLabel: "See Role",
    markerMode: "approximate",
    markerGlyph: "F",
  },
};

export const DISCOVERY_CATEGORY_PILLS = [
  { id: "all", label: "All" },
  { id: "jams", label: "Jams" },
  { id: "musicians", label: "Musicians" },
  { id: "bands", label: "Bands" },
  { id: "shows", label: "Shows" },
];

export const getDiscoveryVariant = (type = "jam") =>
  DISCOVERY_VARIANTS[type] ?? DISCOVERY_VARIANTS.jam;

export const matchesDiscoveryCategory = (item, categoryId = "all") => {
  if (!item || categoryId === "all") return true;

  switch (categoryId) {
    case "jams":
      return item.type === "jam";
    case "musicians":
      // Individual musician profiles: musicians seeking a band/project
      return item.type === "join_band";
    case "bands":
      // Band/project listings: projects seeking a specific musician role
      return item.type === "find_bandmate";
    case "shows":
      return item.type === "promote_show";
    default:
      return true;
  }
};

/**
 * Multi-select variant. activeCategories is a string[].
 * Empty array means "All" — no category restriction.
 * Returns true if the item matches any of the active categories.
 */
export const matchesDiscoveryCategories = (item, activeCategories = []) => {
  if (!item || activeCategories.length === 0) return true;
  return activeCategories.some((id) => matchesDiscoveryCategory(item, id));
};

export const matchesDiscoverySearch = (item, query = "") => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const fields = [
    item.title,
    item.subtitle,
    item.neighborhood,
    item.description,
    item.metaPrimary,
    item.metaSecondary,
    item.ctaLabel,
    item.badgeLabel,
    ...(item.tags ?? []),
    ...(item.genres ?? []),
    ...(item.vibes ?? []),
    ...(item.instruments ?? []),
    ...(item.lookingFor ?? []),
    ...(item.detailRows?.map((row) => row.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return fields.includes(normalizedQuery);
};

// ─── Form themes ──────────────────────────────────────────────────────────────

/**
 * Per-type color theme used by all create/promote forms.
 * Drives step indicator, buttons, active pill highlights, and toggles.
 *
 * Backend note: `type` maps to the `event_type` enum on the events/listings table.
 */
export const FORM_THEMES = {
  jam:          { accent: "#DC2E73", gradientFrom: "#DC2E73", gradientTo: "#FB4040" },
  promote_show: { accent: "#F7C10D", gradientFrom: "#F7C10D", gradientTo: "#F59E0B" },
  join_band:    { accent: "#8B5CF6", gradientFrom: "#8B5CF6", gradientTo: "#7C3AED" },
  find_bandmate:{ accent: "#14B8A6", gradientFrom: "#14B8A6", gradientTo: "#0D9488" },
};

/** Returns the form theme for a given event type, defaulting to jam. */
export const getFormTheme = (type) => FORM_THEMES[type] ?? FORM_THEMES.jam;

export const getDiscoveryAccentColor = (itemOrType) =>
  getDiscoveryVariant(typeof itemOrType === "string" ? itemOrType : itemOrType?.type)
    .accentColor;

export const getDiscoveryCoordinates = (item) => {
  if (!item) return null;

  const exact = item.coordinates ?? (item.lat != null && item.lng != null
    ? { latitude: item.lat, longitude: item.lng }
    : null);

  if (exact) return exact;

  return item.approximateCoordinates ?? null;
};

export const getDiscoveryMarkerMode = (item) => {
  if (!item) return "exact";
  if (item.locationVisibility) return item.locationVisibility;
  return getDiscoveryVariant(item.type).markerMode;
};

export const formatDistanceMiles = (distanceMiles) => {
  if (distanceMiles == null) return null;
  return `${distanceMiles} mi away`;
};

export const hexToRgba = (hex, alpha) => {
  const cleaned = hex.replace("#", "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const metersToPixels = (meters, latitude, zoom) => {
  if (!meters || latitude == null || zoom == null) return 34;
  const metersPerPixel =
    (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
  return clamp(meters / metersPerPixel, 26, 74);
};

export const getDiscoveryPreviewEyebrowItems = (item) => {
  if (!item) return [];
  if (item.previewPills?.length) return item.previewPills.slice(0, 2);
  if (item.tags?.length) return item.tags.slice(0, 2);
  return [getDiscoveryVariant(item.type).label];
};

export const getDiscoveryTypeCountLabel = (items) =>
  items.length === 1 ? "1 item" : `${items.length} items`;
