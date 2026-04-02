/**
 * PromoteShowFooterActions — Cancel / Back / Next / Submit button row.
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
 */
const PromoteShowFooterActions = ({
  step,
  totalSteps,
  canAdvance,
  isSubmitting,
  gradientFrom = "#F7C10D",
  gradientTo   = "#F59E0B",
  onCancel,
  onBack,
  onNext,
  onSubmit,
}) => {
  const isFirst = step === 1;
  const isLast  = step === totalSteps;
  const gradient = `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`;

  return (
    <div
      className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
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

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
          style={{
            background: gradient,
            color: gradientFrom === "#F7C10D" ? "#1a1a1a" : "#ffffff",
          }}
        >
          Next →
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: gradient,
            color: gradientFrom === "#F7C10D" ? "#1a1a1a" : "#ffffff",
          }}
        >
          {isSubmitting ? "Promoting…" : "Promote Show"}
        </button>
      )}
    </div>
  );
};

export default PromoteShowFooterActions;
