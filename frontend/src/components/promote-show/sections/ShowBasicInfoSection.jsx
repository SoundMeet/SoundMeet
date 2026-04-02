// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, required, hint, error, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
        {required && (
          <span style={{ color: "#DC2E73" }} aria-hidden>*</span>
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

// ─── ShowBasicInfoSection ─────────────────────────────────────────────────────

/**
 * ShowBasicInfoSection — show title, date, start time, end time.
 *
 * Props:
 *   form     { title, date, startTime, endTime }
 *   errors   { title?, date?, startTime? }
 *   onChange (field, value) => void
 */
const ShowBasicInfoSection = ({ form, errors = {}, onChange }) => (
  <div className="space-y-4">
    <Field label="Show Title" required error={errors.title}>
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Friday Night Live at The Stage"
        maxLength={80}
        value={form.title}
        onChange={(e) => onChange("title", e.target.value)}
        autoFocus
      />
    </Field>

    <div className="grid grid-cols-2 gap-3">
      <Field label="Date" required error={errors.date}>
        <input
          type="date"
          className="jam-input"
          value={form.date}
          onChange={(e) => onChange("date", e.target.value)}
        />
      </Field>

      <Field label="Start Time" required error={errors.startTime}>
        <input
          type="time"
          className="jam-input"
          value={form.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
        />
      </Field>
    </div>

    <Field label="End Time" hint="Optional — leave blank for open-ended shows">
      <input
        type="time"
        className="jam-input"
        value={form.endTime}
        onChange={(e) => onChange("endTime", e.target.value)}
      />
    </Field>
  </div>
);

export default ShowBasicInfoSection;
