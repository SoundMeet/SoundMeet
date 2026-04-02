import { hexToRgba } from "../../utils/discovery";

/** Single tag pill */
const TagPill = ({ label, accent, highlight }) => (
  <span
    className="h-7 px-3 flex items-center rounded-xl text-xs font-medium whitespace-nowrap"
    style={
      highlight
        ? {
            color: accent,
            background: hexToRgba(accent, 0.1),
            border: `1px solid ${hexToRgba(accent, 0.2)}`,
          }
        : {
            color: "rgba(229,226,225,0.65)",
            border: "1px solid rgba(255,255,255,0.09)",
          }
    }
  >
    {label}
  </span>
);

/**
 * EventTagsSection — renders all tag pills (tags, genres, vibes, skill level, jamType).
 * Merges all available pill sources and deduplicates.
 */
const EventTagsSection = ({ item, accent }) => {
  // Combine all pill sources
  const seenLower = new Set();
  const allPills = [];

  const addPill = (label, highlight = false) => {
    if (!label) return;
    const key = String(label).trim().toLowerCase();
    if (seenLower.has(key)) return;
    seenLower.add(key);
    allPills.push({ label: String(label).trim(), highlight });
  };

  // Tags already formatted (uppercase) — high priority
  (item.tags ?? []).forEach((t) => addPill(t, false));
  // Genres (highlight with accent)
  (item.genres ?? []).forEach((g) => addPill(g, true));
  // Vibes
  (item.vibes ?? []).forEach((v) => addPill(v, false));
  // Single jamType string
  if (item.jamType) addPill(item.jamType, false);
  // Skill level
  if (item.skillLevel) addPill(item.skillLevel, false);

  if (allPills.length === 0) return null;

  return (
    <div className="px-7 pb-5">
      <div className="flex flex-wrap gap-2">
        {allPills.map(({ label, highlight }) => (
          <TagPill key={label} label={label} accent={accent} highlight={highlight} />
        ))}
      </div>
    </div>
  );
};

export default EventTagsSection;
