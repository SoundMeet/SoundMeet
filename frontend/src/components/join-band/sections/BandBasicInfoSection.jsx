import SearchableTagPicker from "../../ui/SearchableTagPicker";
import ImageUploadField from "../../ui/ImageUploadField";

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
        {required && (
          <span style={{ color: "#8B5CF6" }} aria-hidden>*</span>
        )}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs" style={{ color: "#FB4040" }}>{error}</p>
    )}
    {!error && hint && (
      <p className="text-xs" style={{ color: "rgba(229,226,225,0.28)" }}>{hint}</p>
    )}
  </div>
);

// ─── BandBasicInfoSection ─────────────────────────────────────────────────────

/**
 * BandBasicInfoSection — band name, genre(s), city, and optional band photo.
 *
 * Props:
 *   form        { bandName, genres, city, coverImage }
 *   errors      { bandName?, city? }
 *   options     { genres[] }
 *   onChange    (field, value) => void
 *   tagHandlers { genres: { onTogglePreset, onAddCustom, onRemoveCustom } }
 *   accent      string — hex from FORM_THEMES (join_band purple)
 */
const BandBasicInfoSection = ({ form, errors = {}, options, onChange, tagHandlers, accent = "#8B5CF6" }) => (
  <div className="space-y-4">
    <Field label="Band Name" required error={errors.bandName}>
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. The Midnight Collective"
        maxLength={80}
        value={form.bandName}
        onChange={(e) => onChange("bandName", e.target.value)}
        autoFocus
      />
    </Field>

    <SearchableTagPicker
      title="Genres"
      placeholder="Search genres…"
      options={options.genres}
      selectedIds={form.genres.selectedIds}
      customValues={form.genres.customValues}
      accent={accent}
      {...tagHandlers.genres}
    />

    <Field label="City" required error={errors.city} hint="Where is your band based?">
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Miami, FL"
        value={form.city}
        onChange={(e) => onChange("city", e.target.value)}
      />
    </Field>

    <ImageUploadField
      label="Band Photo"
      hint="Optional — a photo of your band or project"
      value={form.coverImage}
      onChange={(v) => onChange("coverImage", v)}
      accent={accent}
    />
  </div>
);

export default BandBasicInfoSection;
