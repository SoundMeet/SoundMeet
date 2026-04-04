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
 * BandmateBasicSection — Step 1: Band / Project Basics.
 *
 * Answers: Who is recruiting, and what project is this for?
 *
 * Props:
 *   form     { bandProjectName, postedByName, cityArea, coverImage, headline, aboutProject }
 *   errors   { bandProjectName?, cityArea? }
 *   onChange (field, value) => void
 *   accent   string — hex from FORM_THEMES (find_bandmate teal)
 */
const BandmateBasicSection = ({ form, errors = {}, onChange, accent = "#14B8A6" }) => (
  <div className="space-y-4">
    {/* Band / Project Name */}
    <Field
      label="Band / Project Name"
      required
      error={errors.bandProjectName}
      hint="The name of the band, project, or act this listing is for."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. The Static Bloom, Meridian Sound"
        maxLength={80}
        value={form.bandProjectName}
        onChange={(e) => onChange("bandProjectName", e.target.value)}
        autoFocus
      />
    </Field>

    {/* Posted by — read-only, tied to logged-in user */}
    {form.postedByName && (
      <div className="space-y-1.5">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          Posted by
        </p>
        <div
          className="jam-input flex items-center gap-2 cursor-default select-none"
          style={{ opacity: 0.55 }}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: accent, color: "#fff" }}
          >
            {form.postedByName.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm">{form.postedByName}</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(229,226,225,0.28)" }}>
          This listing is posted from your SoundMeet account.
        </p>
      </div>
    )}

    {/* City / Area */}
    <Field
      label="City / Area"
      required
      error={errors.cityArea}
      hint="Used to help nearby musicians discover this opportunity."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Miami, FL"
        value={form.cityArea}
        onChange={(e) => onChange("cityArea", e.target.value)}
      />
    </Field>

    {/* Band / Project Photo */}
    <ImageUploadField
      label="Band / Project Photo"
      hint="Optional — a band photo, logo, or image that represents the project."
      value={form.coverImage}
      onChange={(v) => onChange("coverImage", v)}
      accent={accent}
    />

    {/* Headline */}
    <Field
      label="Headline"
      hint='A quick summary musicians will see first. e.g. "Neo-soul project looking for a drummer in Miami"'
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Alt-rock band seeking a bassist for gigs and rehearsals"
        maxLength={120}
        value={form.headline}
        onChange={(e) => onChange("headline", e.target.value)}
      />
    </Field>

    {/* About the Band / Project */}
    <Field
      label="About the Band / Project"
      hint="Tell musicians who you are, what kind of music you make, and what you're building."
    >
      <textarea
        rows={4}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="Describe the project — your sound, goals, current state, and what makes this opportunity worth joining…"
        maxLength={600}
        value={form.aboutProject}
        onChange={(e) => onChange("aboutProject", e.target.value)}
      />
    </Field>
  </div>
);

export default BandmateBasicSection;
