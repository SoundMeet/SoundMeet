import SearchableTagPicker from "../../ui/SearchableTagPicker";
import PillGroup from "../PillGroup";

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <div className="mb-2">
    <p
      className="text-[11px] font-medium uppercase tracking-[0.1em]"
      style={{ color: "rgba(229,226,225,0.4)" }}
    >
      {children}
    </p>
  </div>
);

// ─── MusicianStyleFitSection ──────────────────────────────────────────────────

/**
 * MusicianStyleFitSection — genres, vibe, influences, and artistic identity.
 *
 * Helps bands quickly understand if you're a good creative match.
 *
 * Props:
 *   form        { genres, vibes, influences, coversOriginals }
 *   options     { genres, vibes, coversOriginalsOptions }
 *   onChange    (field, value) => void
 *   tagHandlers { genres, vibes, influences }
 *   accent      string
 */
const MusicianStyleFitSection = ({
  form,
  options,
  onChange,
  tagHandlers,
  accent = "#8B5CF6",
}) => (
  <div className="space-y-5">

    <SearchableTagPicker
      title="Genres"
      placeholder="Search genres…"
      options={options.genres}
      selectedIds={form.genres.selectedIds}
      customValues={form.genres.customValues}
      accent={accent}
      {...tagHandlers.genres}
    />

    <SearchableTagPicker
      title="Vibe"
      placeholder="Search vibes…"
      options={options.vibes}
      selectedIds={form.vibes.selectedIds}
      customValues={form.vibes.customValues}
      accent={accent}
      {...tagHandlers.vibes}
    />

    <SearchableTagPicker
      title="Influences"
      placeholder="Add an influence…"
      helperText="Artists, bands, or sounds that shape your playing."
      options={[]}
      selectedIds={form.influences.selectedIds}
      customValues={form.influences.customValues}
      allowCustom={true}
      accent={accent}
      {...tagHandlers.influences}
    />

    <div>
      <SectionLabel>Covers / Originals</SectionLabel>
      <PillGroup
        options={options.coversOriginalsOptions}
        selected={form.coversOriginals}
        onChange={(val) => onChange("coversOriginals", val)}
        multi={false}
        accent={accent}
      />
    </div>

  </div>
);

export default MusicianStyleFitSection;
