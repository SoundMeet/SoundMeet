// Back / primary CTA bar — used on every step.
// On required steps with 0 selections: primary is disabled + hint shown.
// On optional steps with 0 selections: primary reads "Skip for now →".
export default function ObCTABar({
  onNext,          // fn — advance to next step (null on final step)
  onSubmit,        // fn — submit handler (final step only)
  onBack,          // fn — go back (null on step 0)
  canAdvance,      // bool — primary enabled when true
  isOptional,      // bool — skip label shown when count=0
  count,           // number — selected items count (pill/artist steps)
  submitting,      // bool — loading state on final step
  isFinal,         // bool — is this the last step
}) {
  const isSkip    = isOptional && count === 0;
  const handler   = isFinal ? onSubmit : onNext;
  const label     = isFinal
    ? (submitting ? "Saving…" : "Find my people →")
    : isSkip
      ? "Skip for now →"
      : "Next →";

  const needsHint = !isOptional && !canAdvance && count === 0;

  return (
    <div className="ob-cta-bar">
      <button
        className={`ob-btn-primary${submitting ? " loading" : ""}`}
        onClick={handler}
        disabled={!canAdvance || submitting}
        aria-label={label}
      >
        {label}
      </button>

      {needsHint && (
        <p className="ob-required-hint">Select at least one to continue</p>
      )}

      {onBack && (
        <button
          className="ob-btn-back"
          onClick={onBack}
          disabled={submitting}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
