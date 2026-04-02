/**
 * FindBandmateDetailSections — find_bandmate specific supplemental content.
 * Emphasizes recruiting: needed role, project type, commitment, goals.
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

const FindBandmateDetailSections = ({ item }) => {
  const neededRole = item?.neededRole ?? null;
  const projectType = item?.projectType ?? null;
  const genres = item?.genres ?? [];
  const commitment = item?.commitment ?? null;
  const recruitingNote = item?.recruitingNote ?? null;
  const lookingFor = item?.lookingFor ?? [];

  const hasAny =
    neededRole || projectType || genres.length > 0 || commitment || recruitingNote || lookingFor.length > 0;
  if (!hasAny) return null;

  return (
    <div className="px-7 py-5 space-y-4">
      <FieldRow label="Role needed" value={neededRole} />
      <FieldRow label="Project type" value={projectType} />
      <PillRow label="Genres" items={genres} />
      <PillRow label="Instruments" items={lookingFor} />
      <FieldRow label="Commitment" value={commitment} />
      {recruitingNote && (
        <FieldRow label="Note" value={recruitingNote} />
      )}
    </div>
  );
};

export default FindBandmateDetailSections;
