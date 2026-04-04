import SearchableTagPicker from "../../ui/SearchableTagPicker";
import SingleSelectPillGroup from "../../create-jam/fields/SingleSelectPillGroup";

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
      <p className="text-[11px] mt-0.5 ml-0.5" style={{ color: "rgba(229,226,225,0.22)" }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── BandmateMusicSection ─────────────────────────────────────────────────────

/**
 * BandmateMusicSection — Step 2: Sound & Identity.
 *
 * Answers: What kind of band/project is this, and what does it sound/feel like?
 *
 * Props:
 *   form        { genres, vibe, influences, coversOriginals, currentLineup, projectLevel }
 *   options     { genres[], vibes[], instruments[], lineupRoles[], coversOriginals[], projectLevels[] }
 *   onChange    (field, value) => void
 *   tagHandlers { genres, vibe, influences, currentLineup }
 */
const BandmateMusicSection = ({ form, options, onChange, tagHandlers }) => (
  <div className="space-y-5">
    {/* Genres */}
    <SearchableTagPicker
      title="Genres"
      placeholder="Search genres…"
      options={options.genres}
      selectedIds={form.genres.selectedIds}
      customValues={form.genres.customValues}
      {...tagHandlers.genres}
    />

    {/* Project Vibe */}
    <SearchableTagPicker
      title="Project Vibe"
      placeholder="Search vibes…"
      options={options.vibes}
      selectedIds={form.vibe.selectedIds}
      customValues={form.vibe.customValues}
      {...tagHandlers.vibe}
    />

    {/* Influences */}
    <SearchableTagPicker
      title="Influences"
      placeholder="Artists, bands, or sounds that shape this project…"
      options={[]}
      selectedIds={form.influences.selectedIds}
      customValues={form.influences.customValues}
      {...tagHandlers.influences}
    />

    {/* Covers / Originals */}
    <div>
      <SectionLabel>Covers / Originals</SectionLabel>
      <SingleSelectPillGroup
        options={options.coversOriginals}
        selected={form.coversOriginals}
        onChange={(val) => onChange("coversOriginals", val)}
      />
    </div>

    {/* Current Lineup */}
    <SearchableTagPicker
      title="Current Lineup"
      placeholder="Who's already in the project…"
      options={options.lineupRoles}
      selectedIds={form.currentLineup.selectedIds}
      customValues={form.currentLineup.customValues}
      {...tagHandlers.currentLineup}
    />

    {/* Project Level */}
    <div>
      <SectionLabel hint="The overall experience level of this project.">
        Project Level
      </SectionLabel>
      <SingleSelectPillGroup
        options={options.projectLevels}
        selected={form.projectLevel}
        onChange={(val) => onChange("projectLevel", val)}
      />
    </div>
  </div>
);

export default BandmateMusicSection;
