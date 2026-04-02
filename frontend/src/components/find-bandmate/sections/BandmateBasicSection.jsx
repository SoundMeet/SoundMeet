import ImageUploadField from "../../../components/ui/ImageUploadField";

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
          <span style={{ color: "#14B8A6" }} aria-hidden>*</span>
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

// ─── BandmateBasicSection ─────────────────────────────────────────────────────

/**
 * BandmateBasicSection — display name, city, and optional profile photo.
 *
 * Props:
 *   form     { displayName, city, coverImage }
 *   errors   { displayName?, city? }
 *   onChange (field, value) => void
 *   accent   string — hex from FORM_THEMES (find_bandmate teal)
 */
const BandmateBasicSection = ({ form, errors = {}, onChange, accent = "#14B8A6" }) => (
  <div className="space-y-4">
    <Field label="Your Name or Alias" required error={errors.displayName}>
      <input
        type="text"
        className="jam-input"
        placeholder="Your name or alias"
        maxLength={60}
        value={form.displayName}
        onChange={(e) => onChange("displayName", e.target.value)}
        autoFocus
      />
    </Field>

    <Field label="City" required error={errors.city} hint="Where are you based?">
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Miami, FL"
        value={form.city}
        onChange={(e) => onChange("city", e.target.value)}
      />
    </Field>

    <ImageUploadField
      label="Profile / Press Photo"
      hint="Optional — a photo of you or your band"
      value={form.coverImage}
      onChange={(v) => onChange("coverImage", v)}
      accent={accent}
    />
  </div>
);

export default BandmateBasicSection;
