import { AnimatePresence, motion } from "framer-motion";
import { isOvernightEnd } from "../../../utils/validateJamCoreDetails";

// ─── Shared field wrapper ──────────────────────────────────────────────────────

/**
 * Field — labeled wrapper with animated inline error or hint.
 *
 * Props:
 *   label       string
 *   required    boolean
 *   hint        string    — shown when no error is present
 *   error       string    — takes priority over hint
 *   labelRight  ReactNode — optional content pinned to the right of the label row
 *   children    ReactNode
 */
const Field = ({ label, required, hint, error, labelRight, children }) => (
  <div className="space-y-1.5">
    {label && (
      <div className="flex items-center justify-between">
        <label
          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          {label}
          {required && (
            <span style={{ color: "#DC2E73" }} aria-hidden>*</span>
          )}
        </label>
        {labelRight}
      </div>
    )}
    {children}
    <AnimatePresence>
      {error ? (
        <motion.p
          key="error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-xs"
          style={{ color: "#FB4040" }}
        >
          {error}
        </motion.p>
      ) : hint ? (
        <motion.p
          key="hint"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-xs"
          style={{ color: "rgba(229,226,225,0.28)" }}
        >
          {hint}
        </motion.p>
      ) : null}
    </AnimatePresence>
  </div>
);

// ─── Title character counter ───────────────────────────────────────────────────

const TITLE_MAX  = 80;
const TITLE_WARN = 60; // show counter once this many chars are typed

const TitleCharCount = ({ length }) => {
  if (length < TITLE_WARN) return null;
  const remaining = TITLE_MAX - length;
  return (
    <span
      className="text-[10px] tabular-nums"
      style={{ color: remaining <= 10 ? "#FB4040" : "rgba(229,226,225,0.3)" }}
    >
      {remaining} left
    </span>
  );
};

// ─── Overnight badge ───────────────────────────────────────────────────────────

const OvernightBadge = () => (
  <motion.span
    key="overnight-badge"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.15 }}
    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
    style={{
      background: "rgba(220,46,115,0.15)",
      color: "#DC2E73",
      letterSpacing: "0.04em",
    }}
  >
    +1 day
  </motion.span>
);

// ─── JamBasicInfoSection ───────────────────────────────────────────────────────

/**
 * JamBasicInfoSection — title, date, start time, end time (optional).
 *
 * Props:
 *   form        { title, date, startTime, endTime }
 *   errors      { title?, date?, startTime?, endTime? }
 *   touched     { title?, date?, startTime?, endTime? }
 *   onChange    (field, value) => void
 *   onBlur      (field) => void
 */
const JamBasicInfoSection = ({ form, errors, touched, onChange, onBlur }) => {
  const overnight = isOvernightEnd(form.startTime, form.endTime);

  // Hint text for end time: overnight context beats the generic optional note
  const endTimeHint = (() => {
    if (touched.endTime && errors.endTime) return undefined; // error wins
    if (overnight) return "Ends the following day";
    return "Optional — leave blank for open-ended jams";
  })();

  return (
    <div className="space-y-4">
      {/* Title */}
      <Field
        label="Jam Title"
        required
        error={touched.title && errors.title}
      >
        <div className="relative">
          <input
            type="text"
            className="jam-input"
            placeholder="e.g. Sunday Jazz Rooftop Session"
            value={form.title}
            maxLength={TITLE_MAX}
            onChange={(e) => onChange("title", e.target.value)}
            onBlur={() => onBlur("title")}
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <TitleCharCount length={form.title.length} />
          </span>
        </div>
      </Field>

      {/* Date + Start Time */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required error={touched.date && errors.date}>
          <input
            type="date"
            className="jam-input"
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
            onBlur={() => onBlur("date")}
          />
        </Field>

        <Field label="Start Time" required error={touched.startTime && errors.startTime}>
          <input
            type="time"
            className="jam-input"
            value={form.startTime}
            onChange={(e) => onChange("startTime", e.target.value)}
            onBlur={() => onBlur("startTime")}
          />
        </Field>
      </div>

      {/* End Time (optional, overnight-aware) */}
      <Field
        label="End Time"
        hint={endTimeHint}
        error={touched.endTime && errors.endTime}
        labelRight={
          <AnimatePresence>
            {overnight && <OvernightBadge />}
          </AnimatePresence>
        }
      >
        <input
          type="time"
          className="jam-input"
          value={form.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          onBlur={() => onBlur("endTime")}
        />
      </Field>
    </div>
  );
};

export default JamBasicInfoSection;
export { Field };
