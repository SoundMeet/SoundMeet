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

// ─── MusicianLookingForSection ────────────────────────────────────────────────

/**
 * MusicianLookingForSection — what kind of opportunity you want.
 *
 * Props:
 *   form     { opportunityTypes, commitment, availability, travelRadius, paidStatus }
 *   options  { opportunityTypes, commitmentOptions, availabilityOptions,
 *              travelRadiusOptions, paidStatusOptions }
 *   onChange (field, value) => void
 *   accent   string
 */
const MusicianLookingForSection = ({
  form,
  options,
  onChange,
  accent = "#8B5CF6",
}) => (
  <div className="space-y-5">

    <div>
      <SectionLabel hint="Pick everything that sounds right for you.">
        I'm open to
      </SectionLabel>
      <PillGroup
        options={options.opportunityTypes}
        selected={form.opportunityTypes}
        onChange={(val) => onChange("opportunityTypes", val)}
        multi={true}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel>Commitment Level</SectionLabel>
      <PillGroup
        options={options.commitmentOptions}
        selected={form.commitment}
        onChange={(val) => onChange("commitment", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel hint="When are you generally available to rehearse or perform?">
        Availability
      </SectionLabel>
      <PillGroup
        options={options.availabilityOptions}
        selected={form.availability}
        onChange={(val) => onChange("availability", val)}
        multi={true}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel hint="How far are you willing to travel for rehearsals or shows?">
        Travel Radius
      </SectionLabel>
      <PillGroup
        options={options.travelRadiusOptions}
        selected={form.travelRadius}
        onChange={(val) => onChange("travelRadius", val)}
        multi={false}
        accent={accent}
      />
    </div>

    <div>
      <SectionLabel>Paid / Unpaid</SectionLabel>
      <PillGroup
        options={options.paidStatusOptions}
        selected={form.paidStatus}
        onChange={(val) => onChange("paidStatus", val)}
        multi={false}
        accent={accent}
      />
    </div>

  </div>
);

export default MusicianLookingForSection;
