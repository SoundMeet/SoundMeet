/**
 * CreateJamFooterActions — Cancel / Back / Next / Submit button row.
 *
 * Props:
 *   step          number
 *   totalSteps    number
 *   canAdvance    boolean
 *   isSubmitting  boolean
 *   gradientFrom  string   — hex, from FORM_THEMES
 *   gradientTo    string   — hex, from FORM_THEMES
 *   onCancel      () => void
 *   onBack        () => void
 *   onNext        () => void
 *   onSubmit      () => void
 *   submitLabel   string?  — defaults to "Create Jam"
 */
const CreateJamFooterActions = ({
  step,
  totalSteps,
  canAdvance,
  isSubmitting,
  gradientFrom = "#DC2E73",
  gradientTo   = "#FB4040",
  onCancel,
  onBack,
  onNext,
  onSubmit,
  submitLabel = "Create Jam",
}) => {
  const isFirst = step === 1;
  const isLast  = step === totalSteps;
  const gradient = `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`;

  return (
    <div
      className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Cancel / Back */}
      <button
        type="button"
        onClick={isFirst ? onCancel : onBack}
        className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(229,226,225,0.5)",
        }}
      >
        {isFirst ? "Cancel" : "← Back"}
      </button>

      {/* Next / Submit */}
      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ background: gradient }}
        >
          Next →
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: gradient }}
        >
          {isSubmitting ? "Creating…" : submitLabel}
        </button>
      )}
    </div>
  );
};

export default CreateJamFooterActions;
