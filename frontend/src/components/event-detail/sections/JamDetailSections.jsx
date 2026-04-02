/**
 * JamDetailSections — jam-specific supplemental content.
 * Rendered inside EventDetailModal for type === 'jam'.
 *
 * Shows instruments wanted, vibes, and jam format context.
 * All data gracefully hidden if not present.
 */

const PillList = ({ label, items }) => {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="h-6 px-2.5 flex items-center rounded-lg text-[11px] font-medium text-neutral-400 border border-white/[0.09]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const JamDetailSections = ({ item }) => {
  const instruments = item?.instruments ?? item?.instrumentsNeeded ?? [];
  const vibes = item?.vibes ?? [];
  const jamType = item?.jamType ?? null;
  const skillLevel = item?.skillLevel ?? null;

  const hasAny = instruments.length > 0 || vibes.length > 0 || jamType || skillLevel;
  if (!hasAny) return null;

  return (
    <div className="px-7 py-5 space-y-4">
      {jamType && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1.5">
            Format
          </p>
          <p className="text-sm text-neutral-300">{jamType}</p>
        </div>
      )}

      <PillList label="Looking for" items={instruments} />
      <PillList label="Vibe" items={vibes} />
    </div>
  );
};

export default JamDetailSections;
