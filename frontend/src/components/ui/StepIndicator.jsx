import { motion } from "framer-motion";
import { hexToRgba } from "../../utils/discovery";

/**
 * StepIndicator — shared across all create/promote forms.
 *
 * Props:
 *   steps        { number, label }[]  — full step list
 *   currentStep  number               — 1-based
 *   accent       string               — hex color from FORM_THEMES
 *   gradientFrom string               — gradient start hex
 *   gradientTo   string               — gradient end hex
 *   onStepClick  (stepNumber) => void — navigate to a previously visited step
 */
const StepIndicator = ({
  steps,
  currentStep,
  accent,
  gradientFrom,
  gradientTo,
  onStepClick,
}) => (
  <div className="flex items-center gap-1.5">
    {steps.map((s) => {
      const isCompleted = s.number < currentStep;
      const isCurrent   = s.number === currentStep;
      const isFuture    = s.number > currentStep;

      return (
        <motion.div
          key={s.number}
          role={isCompleted ? "button" : undefined}
          aria-label={isCompleted ? `Go back to step ${s.number}: ${s.label}` : undefined}
          onClick={isCompleted ? () => onStepClick(s.number) : undefined}
          animate={{
            width:   isCurrent ? 24 : 8,
            opacity: isFuture  ? 0.2 : 1,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height:       8,
            borderRadius: 9999,
            cursor:       isCompleted ? "pointer" : "default",
            flexShrink:   0,
            background:
              isCurrent || isCompleted
                ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`
                : "rgba(255,255,255,0.15)",
            boxShadow:
              isCurrent
                ? `0 0 8px ${hexToRgba(accent, 0.5)}`
                : "none",
          }}
        />
      );
    })}
  </div>
);

export default StepIndicator;
