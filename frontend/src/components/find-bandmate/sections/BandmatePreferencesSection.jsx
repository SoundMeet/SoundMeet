import SearchableTagPicker from "../../ui/SearchableTagPicker";
import MultiSelectPillGroup from "../../create-jam/fields/MultiSelectPillGroup";

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

// ─── BandmatePreferencesSection ───────────────────────────────────────────────

/**
 * BandmatePreferencesSection — roles seeking, availability, description, contact info.
 *
 * Props:
 *   form        { rolesSeeking, availability, description, contactInfo }
 *   options     { rolesSeeking[], availability[] }
 *   onChange    (field, value) => void
 *   tagHandlers { rolesSeeking }
 */
const BandmatePreferencesSection = ({ form, options, onChange, tagHandlers }) => (
  <div className="space-y-5">
    <SearchableTagPicker
      title="Roles You're Seeking"
      placeholder="Search roles…"
      options={options.rolesSeeking}
      selectedIds={form.rolesSeeking.selectedIds}
      customValues={form.rolesSeeking.customValues}
      {...tagHandlers.rolesSeeking}
    />

    <Field label="Availability">
      <MultiSelectPillGroup
        options={options.availability}
        selected={form.availability.selectedIds}
        onChange={(ids) =>
          onChange("availability", { ...form.availability, selectedIds: ids })
        }
      />
    </Field>

    <Field
      label="About You"
      hint="Tell bands what you bring to the table."
    >
      <textarea
        rows={3}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="Tell bands about yourself, your experience, and what you're looking for…"
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
      />
    </Field>

    <Field
      label="Contact Info"
      hint="Email or social link bands can use to reach you."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. you@email.com or instagram.com/yourhandle"
        value={form.contactInfo}
        onChange={(e) => onChange("contactInfo", e.target.value)}
      />
    </Field>
  </div>
);

export default BandmatePreferencesSection;
