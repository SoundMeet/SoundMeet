import SearchableTagPicker from "../../ui/SearchableTagPicker";
import MultiSelectPillGroup from "../../create-jam/fields/MultiSelectPillGroup";
import SingleSelectPillGroup from "../../create-jam/fields/SingleSelectPillGroup";

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

// ─── BandmatePreferencesSection ───────────────────────────────────────────────

/**
 * BandmatePreferencesSection — Step 3: The Opening.
 *
 * Answers: Who are you looking for, and what should they know before reaching out?
 *
 * Props:
 *   form        { rolesNeeded, skillLevelDesired, availability, commitmentLevel,
 *                 whatLookingFor, contactInfo }
 *   options     { rolesNeeded[], skillLevelsDesired[], availability[], commitmentLevels[] }
 *   onChange    (field, value) => void
 *   tagHandlers { rolesNeeded }
 */
const BandmatePreferencesSection = ({ form, options, onChange, tagHandlers }) => (
  <div className="space-y-5">
    {/* Roles Needed */}
    <SearchableTagPicker
      title="Roles Needed"
      placeholder="Search roles…"
      options={options.rolesNeeded}
      selectedIds={form.rolesNeeded.selectedIds}
      customValues={form.rolesNeeded.customValues}
      {...tagHandlers.rolesNeeded}
    />

    {/* Skill Level Desired */}
    <div>
      <SectionLabel hint="What level of player fits this opening?">
        Skill Level Desired
      </SectionLabel>
      <SingleSelectPillGroup
        options={options.skillLevelsDesired}
        selected={form.skillLevelDesired}
        onChange={(val) => onChange("skillLevelDesired", val)}
      />
    </div>

    {/* Availability */}
    <Field label="Availability" hint="When does the project typically meet or rehearse?">
      <MultiSelectPillGroup
        options={options.availability}
        selected={form.availability.selectedIds}
        onChange={(ids) =>
          onChange("availability", { ...form.availability, selectedIds: ids })
        }
      />
    </Field>

    {/* Commitment Level */}
    <div>
      <SectionLabel hint="Set expectations for how serious or casual this opportunity is.">
        Commitment Level
      </SectionLabel>
      <SingleSelectPillGroup
        options={options.commitmentLevels}
        selected={form.commitmentLevel}
        onChange={(val) => onChange("commitmentLevel", val)}
      />
    </div>

    {/* What You're Looking For */}
    <Field
      label="What You're Looking For"
      hint="Describe the kind of bandmate you need, what the project requires, and anything important someone should know before reaching out."
    >
      <textarea
        rows={4}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="Describe the ideal fit — their style, attitude, goals, and what they'll bring to the project…"
        value={form.whatLookingFor}
        onChange={(e) => onChange("whatLookingFor", e.target.value)}
      />
    </Field>

    {/* Contact / Response Info */}
    <Field
      label="Contact / Response Info"
      hint="Share the best way for interested musicians to reach you."
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
