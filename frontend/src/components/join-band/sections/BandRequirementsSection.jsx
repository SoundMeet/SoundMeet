import SearchableTagPicker from "../../ui/SearchableTagPicker";
import SingleSelectPillGroup from "../../create-jam/fields/SingleSelectPillGroup";

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p
    className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2"
    style={{ color: "rgba(229,226,225,0.4)" }}
  >
    {children}
  </p>
);

// ─── BandRequirementsSection ──────────────────────────────────────────────────

/**
 * BandRequirementsSection — roles needed, instruments, skill level, vibes.
 *
 * Props:
 *   form        { rolesNeeded, instrumentsNeeded, vibes, skillLevel }
 *   options     { rolesNeeded[], instruments[], vibes[], skillLevels[] }
 *   onChange    (field, value) => void
 *   tagHandlers { rolesNeeded, instrumentsNeeded, vibes }
 */
const BandRequirementsSection = ({ form, options, onChange, tagHandlers }) => (
  <div className="space-y-5">
    <SearchableTagPicker
      title="Roles Needed"
      placeholder="Search roles…"
      options={options.rolesNeeded}
      selectedIds={form.rolesNeeded.selectedIds}
      customValues={form.rolesNeeded.customValues}
      {...tagHandlers.rolesNeeded}
    />

    <SearchableTagPicker
      title="Instruments Needed"
      placeholder="Search instruments…"
      options={options.instruments}
      selectedIds={form.instrumentsNeeded.selectedIds}
      customValues={form.instrumentsNeeded.customValues}
      {...tagHandlers.instrumentsNeeded}
    />

    <div>
      <SectionLabel>Skill Level</SectionLabel>
      <SingleSelectPillGroup
        options={options.skillLevels}
        selected={form.skillLevel}
        onChange={(val) => onChange("skillLevel", val)}
      />
    </div>

    <SearchableTagPicker
      title="Vibe"
      placeholder="Search vibes…"
      options={options.vibes}
      selectedIds={form.vibes.selectedIds}
      customValues={form.vibes.customValues}
      {...tagHandlers.vibes}
    />
  </div>
);

export default BandRequirementsSection;
