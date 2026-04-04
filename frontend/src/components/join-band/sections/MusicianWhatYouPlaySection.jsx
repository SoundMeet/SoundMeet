import SearchableTagPicker from "../../ui/SearchableTagPicker";
import PillGroup from "../PillGroup";

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children, hint }) => (
  <div className="mb-2">
    <p
      className="text-[11px] font-medium uppercase tracking-[0.1em]"
      style={{ color: "rgba(229,226,225,0.4)" }}
    >
      {children}
    </p>
    {hint && (
      <p className="text-[11px] mt-0.5" style={{ color: "rgba(229,226,225,0.25)" }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
      </label>
    )}
    {children}
    {hint && (
      <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.22)" }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── MusicianWhatYouPlaySection ───────────────────────────────────────────────

/**
 * MusicianWhatYouPlaySection — what you bring musically.
 *
 * Props:
 *   form        { primaryRole, secondaryRoles, instruments, skillLevel,
 *                 yearsPlaying, experience, gear, vocals }
 *   options     { roles, skillLevels, yearsPlayingOptions, experienceTypes,
 *                 vocalTypes, instruments }
 *   onChange    (field, value) => void
 *   tagHandlers { secondaryRoles, instruments }
 *   accent      string
 */
const MusicianWhatYouPlaySection = ({
  form,
  options,
  onChange,
  tagHandlers,
  accent = "#8B5CF6",
}) => (
  <div className="space-y-5">

    <div>
      <SectionLabel>Primary Role</SectionLabel>
      <PillGroup
        options={options.roles}
        selected={form.primaryRole}
        onChange={(val) => onChange("primaryRole", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <SearchableTagPicker
      title="Secondary Roles"
      placeholder="Search roles…"
      options={options.roles}
      selectedIds={form.secondaryRoles.selectedIds}
      customValues={form.secondaryRoles.customValues}
      accent={accent}
      {...tagHandlers.secondaryRoles}
    />

    <SearchableTagPicker
      title="Instruments"
      placeholder="Search instruments…"
      options={options.instruments}
      selectedIds={form.instruments.selectedIds}
      customValues={form.instruments.customValues}
      accent={accent}
      {...tagHandlers.instruments}
    />

    <div>
      <SectionLabel>Skill Level</SectionLabel>
      <PillGroup
        options={options.skillLevels}
        selected={form.skillLevel}
        onChange={(val) => onChange("skillLevel", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel>Years Playing</SectionLabel>
      <PillGroup
        options={options.yearsPlayingOptions}
        selected={form.yearsPlaying}
        onChange={(val) => onChange("yearsPlaying", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel hint="Select everything that applies.">Experience</SectionLabel>
      <PillGroup
        options={options.experienceTypes}
        selected={form.experience}
        onChange={(val) => onChange("experience", val)}
        multi={true}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel>Vocals</SectionLabel>
      <PillGroup
        options={options.vocalTypes}
        selected={form.vocals}
        onChange={(val) => onChange("vocals", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <Field label="Gear" hint="Optional — anything notable about your setup.">
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. '72 Ludwig kit, Boss pedalboard, Fender Twin"
        maxLength={200}
        value={form.gear}
        onChange={(e) => onChange("gear", e.target.value)}
      />
    </Field>

  </div>
);

export default MusicianWhatYouPlaySection;
