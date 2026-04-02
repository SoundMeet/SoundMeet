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

// ─── BandmateMusicSection ─────────────────────────────────────────────────────

/**
 * BandmateMusicSection — genres, instruments you play, vibes, skill level.
 *
 * Props:
 *   form        { genres, instrumentsYouPlay, vibes, skillLevel }
 *   options     { genres[], instruments[], vibes[], skillLevels[] }
 *   onChange    (field, value) => void
 *   tagHandlers { genres, instrumentsYouPlay, vibes }
 */
const BandmateMusicSection = ({ form, options, onChange, tagHandlers }) => (
  <div className="space-y-5">
    <SearchableTagPicker
      title="Genres"
      placeholder="Search genres…"
      options={options.genres}
      selectedIds={form.genres.selectedIds}
      customValues={form.genres.customValues}
      {...tagHandlers.genres}
    />

    <SearchableTagPicker
      title="Instruments You Play"
      placeholder="Search instruments…"
      options={options.instruments}
      selectedIds={form.instrumentsYouPlay.selectedIds}
      customValues={form.instrumentsYouPlay.customValues}
      {...tagHandlers.instrumentsYouPlay}
    />

    <SearchableTagPicker
      title="Your Vibe"
      placeholder="Search vibes…"
      options={options.vibes}
      selectedIds={form.vibes.selectedIds}
      customValues={form.vibes.customValues}
      {...tagHandlers.vibes}
    />

    <div>
      <SectionLabel>Skill Level</SectionLabel>
      <SingleSelectPillGroup
        options={options.skillLevels}
        selected={form.skillLevel}
        onChange={(val) => onChange("skillLevel", val)}
      />
    </div>
  </div>
);

export default BandmateMusicSection;
