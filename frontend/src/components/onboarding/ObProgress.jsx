import { STEPS } from "./onboardingConfig";

export default function ObProgress({ step }) {
  const total = STEPS.length;
  const pct   = ((step + 1) / total) * 100;
  const label = STEPS[step]?.label ?? "";

  return (
    <div className="ob-prog-wrap">
      <div className="ob-prog-meta">
        <span className="ob-prog-label">{label}</span>
        <span className="ob-prog-counter">{step + 1} / {total}</span>
      </div>
      <div className="ob-prog-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
        <div className="ob-prog-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
