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

// ─── ListingPreferencesSection ────────────────────────────────────────────────

/**
 * ListingPreferencesSection — status, intent, and collaboration scope.
 *
 * Focused on listing-relevant signals that help bands evaluate fit.
 * No visibility/privacy toggles, no publishing workflow UI.
 *
 * Props:
 *   form     { listingStatus, openTo, collaborationScope }
 *   options  { listingStatusOptions, openToOptions, collaborationScopeOptions }
 *   onChange (field, value) => void
 *   accent   string
 */
const ListingPreferencesSection = ({
  form,
  options,
  onChange,
  accent = "#8B5CF6",
}) => (
  <div className="space-y-5">

    <div>
      <SectionLabel hint="Helps bands understand where you're at right now.">
        Your Status
      </SectionLabel>
      <PillGroup
        options={options.listingStatusOptions}
        selected={form.listingStatus}
        onChange={(val) => onChange("listingStatus", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel hint="Pick everything that applies — you can update this any time.">
        I'm open to
      </SectionLabel>
      <PillGroup
        options={options.openToOptions}
        selected={form.openTo}
        onChange={(val) => onChange("openTo", val)}
        multi={true}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel hint="How far are you willing to take this?">
        Collaboration Scope
      </SectionLabel>
      <PillGroup
        options={options.collaborationScopeOptions}
        selected={form.collaborationScope}
        onChange={(val) => onChange("collaborationScope", val)}
        multi={false}
        accent={accent}
      />
    </div>

  </div>
);

export default ListingPreferencesSection;
