// ─── Field wrapper ────────────────────────────────────────────────────────────

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
      <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.22)" }}>{hint}</p>
    )}
  </div>
);

// ─── Privacy toggle ───────────────────────────────────────────────────────────

const PrivacyToggle = ({ value, onChange }) => {
  const opts = [
    { id: "public",  label: "Public" },
    { id: "private", label: "Private" },
  ];

  return (
    <div className="flex rounded-xl p-1" style={{ background: "#1C1B1B" }}>
      {opts.map((opt) => {
        const active = (opt.id === "private") === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id === "private")}
            className="relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
            style={{
              background: active
                ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                : "transparent",
              color: active ? "#ffffff" : "rgba(229,226,225,0.3)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── BandContactSection ───────────────────────────────────────────────────────

/**
 * BandContactSection — description, contact info, privacy.
 *
 * Props:
 *   form     { description, contactInfo, isPrivate }
 *   onChange (field, value) => void
 */
const BandContactSection = ({ form, onChange }) => (
  <div className="space-y-5">
    <Field
      label="About the Band"
      hint="Tell musicians what makes your band unique."
    >
      <textarea
        rows={4}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="Describe your sound, your goals, and what you're looking for in a member…"
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
      />
    </Field>

    <Field
      label="Contact Info"
      hint="Email or link musicians can use to reach you."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. band@email.com or instagram.com/yourband"
        value={form.contactInfo}
        onChange={(e) => onChange("contactInfo", e.target.value)}
      />
    </Field>

    <div
      className="space-y-2 pt-2"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Visibility
      </label>
      <PrivacyToggle value={form.isPrivate} onChange={(v) => onChange("isPrivate", v)} />
      <p
        className="text-xs ml-1"
        style={{ color: "rgba(229,226,225,0.28)" }}
      >
        {form.isPrivate
          ? "Private — contact info hidden until you approve a musician."
          : "Public — contact info visible to all musicians."}
      </p>
    </div>
  </div>
);

export default BandContactSection;
