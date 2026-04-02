/**
 * JoinBandDetailSections — join_band specific supplemental content.
 * Emphasizes musician profile: instrument, genres, influences, commitment, goals.
 */

const FieldRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1">
        {label}
      </p>
      <p className="text-sm text-neutral-300">{value}</p>
    </div>
  );
};

const PillRow = ({ label, items }) => {
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

const JoinBandDetailSections = ({ item }) => {
  const instrument = item?.primaryInstrument ?? null;
  const genres = item?.genres ?? [];
  const influences = item?.influences ?? [];
  const commitment = item?.commitment ?? null;
  const bandGoals = item?.bandGoals ?? null;

  const hasAny = instrument || genres.length > 0 || influences.length > 0 || commitment || bandGoals;
  if (!hasAny) return null;

  return (
    <div className="px-7 py-5 space-y-4">
      <FieldRow label="Instrument" value={instrument} />
      <PillRow label="Genres" items={genres} />
      <PillRow label="Influences" items={influences} />
      <FieldRow label="Commitment" value={commitment} />
      <FieldRow label="Looking for" value={bandGoals} />
    </div>
  );
};

export default JoinBandDetailSections;
