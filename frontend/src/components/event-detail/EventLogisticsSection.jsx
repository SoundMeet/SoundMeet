/**
 * EventLogisticsSection — key/value detail grid (from item.detailRows).
 * Also surfaces any logistics fields that exist on the item directly.
 */

const LabelValue = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-neutral-300">{value}</p>
    </div>
  );
};

const EventLogisticsSection = ({ item }) => {
  // Build rows from detailRows first, then supplement with direct fields
  const rows = item?.detailRows ?? [];

  // Extra logistics fields that may be on the item but not in detailRows
  const extras = [
    { label: "Gear provided", value: item?.gearProvided ?? null },
    { label: "Gear to bring", value: item?.gearToBring ?? null },
    { label: "Audience", value: item?.audienceAllowed != null ? (item.audienceAllowed ? "Audience welcome" : "Musicians only") : null },
    { label: "Recording", value: item?.recordingPolicy ?? null },
    { label: "Parking", value: item?.parkingInfo ?? null },
    { label: "Accessibility", value: item?.accessibilityNotes ?? null },
    { label: "House rules", value: item?.rules ?? null },
  ].filter((e) => e.value);

  // Deduplicate extras against existing detailRows
  const existingLabels = new Set(rows.map((r) => r.label.toLowerCase()));
  const uniqueExtras = extras.filter(
    (e) => !existingLabels.has(e.label.toLowerCase())
  );

  const allRows = [...rows, ...uniqueExtras];

  if (allRows.length === 0) return null;

  return (
    <div className="px-7 py-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {allRows.map(({ label, value }) => (
          <LabelValue key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
};

export default EventLogisticsSection;
