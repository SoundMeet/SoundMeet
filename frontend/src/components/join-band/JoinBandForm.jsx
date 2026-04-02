import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import BandBasicInfoSection from "./sections/BandBasicInfoSection";
import BandRequirementsSection from "./sections/BandRequirementsSection";
import BandContactSection from "./sections/BandContactSection";
import JoinBandFooterActions from "./JoinBandFooterActions";
import StepIndicator from "../ui/StepIndicator";
import { joinBandOptions } from "../../data/mockJoinBandOptions";
import { buildJoinBandPayload } from "../../utils/buildJoinBandPayload";
import { getFormTheme } from "../../utils/discovery";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Band Info"         },
  { number: 2, label: "Requirements"      },
  { number: 3, label: "Contact & Privacy" },
];

const THEME = getFormTheme("join_band");

// ─── Form state ───────────────────────────────────────────────────────────────

const tagGroup = () => ({ selectedIds: [], customValues: [] });

const INITIAL_FORM = {
  bandName:          "",
  genres:            tagGroup(),
  city:              "",
  rolesNeeded:       tagGroup(),
  instrumentsNeeded: tagGroup(),
  vibes:             tagGroup(),
  skillLevel:        null,
  description:       "",
  contactInfo:       "",
  isPrivate:         false,

  // Media: { file: File, previewUrl: string } | null
  // Backend: upload to storage, store URL as cover_image_url on the record.
  coverImage: null,
};

// ─── Tag group handler factory ────────────────────────────────────────────────

const makeTagHandlers = (setForm, field) => ({
  onTogglePreset: (id) =>
    setForm((prev) => {
      const g = prev[field];
      const ids = g.selectedIds.includes(id)
        ? g.selectedIds.filter((i) => i !== id)
        : [...g.selectedIds, id];
      return { ...prev, [field]: { ...g, selectedIds: ids } };
    }),
  onAddCustom: (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], customValues: [...prev[field].customValues, val] },
    })),
  onRemoveCustom: (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        customValues: prev[field].customValues.filter((v) => v !== val),
      },
    })),
});

// ─── Slide animation ──────────────────────────────────────────────────────────

const stepVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ?  24 : -24 }),
  center:            { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -24 :  24 }),
};

// ─── JoinBandForm ─────────────────────────────────────────────────────────────

/**
 * JoinBandForm — owns all form state and step navigation.
 *
 * Props:
 *   options  JoinBandOptionSets — injectable (default: mockJoinBandOptions)
 *   onClose  () => void
 */
const JoinBandForm = ({ options = joinBandOptions, onClose }) => {
  const [form,         setForm]         = useState(INITIAL_FORM);
  const [step,         setStep]         = useState(1);
  const [direction,    setDirection]    = useState(1);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.bandName.trim()) newErrors.bandName = "Band name is required";
    if (!form.city.trim())     newErrors.city     = "City is required";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    if (step === 2) valid = true;
    if (step === 3) valid = true;
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  // Jump directly to a previously visited step (from StepIndicator click)
  const goToStep = (n) => {
    if (n >= step) return;
    setDirection(-1);
    setStep(n);
  };

  const canAdvance = (() => {
    if (step === 1) return !!form.bandName.trim() && !!form.city.trim();
    return true;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = buildJoinBandPayload(form);
    try {
      // TODO: wire up real API call — e.g. await api.joinBand(payload)
      await new Promise((r) => setTimeout(r, 900));
      onClose();
    } catch (err) {
      console.error("Join band failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tag handlers ───────────────────────────────────────────────────────────

  const tagHandlers = {
    genres:            makeTagHandlers(setForm, "genres"),
    rolesNeeded:       makeTagHandlers(setForm, "rolesNeeded"),
    instrumentsNeeded: makeTagHandlers(setForm, "instrumentsNeeded"),
    vibes:             makeTagHandlers(setForm, "vibes"),
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div>
          <Dialog.Title className="text-xl font-bold text-white tracking-tight">
            Join a Band
          </Dialog.Title>
          <p
            className="text-[10px] font-medium uppercase tracking-[0.12em] mt-0.5"
            style={{ color: "rgba(229,226,225,0.32)" }}
          >
            {STEPS[step - 1].label}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StepIndicator
            steps={STEPS}
            currentStep={step}
            accent={THEME.accent}
            gradientFrom={THEME.gradientFrom}
            gradientTo={THEME.gradientTo}
            onStepClick={goToStep}
          />
          <Dialog.Close asChild>
            <button
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(229,226,225,0.45)",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          </Dialog.Close>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-6 pb-5"
        style={{ scrollbarWidth: "none" }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <BandBasicInfoSection
                form={form}
                errors={errors}
                options={options}
                onChange={setField}
                tagHandlers={tagHandlers}
                accent={THEME.accent}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <BandRequirementsSection
                form={form}
                options={options}
                onChange={setField}
                tagHandlers={tagHandlers}
                accent={THEME.accent}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <BandContactSection
                form={form}
                onChange={setField}
                accent={THEME.accent}
                gradientFrom={THEME.gradientFrom}
                gradientTo={THEME.gradientTo}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <JoinBandFooterActions
        step={step}
        totalSteps={STEPS.length}
        canAdvance={canAdvance}
        isSubmitting={isSubmitting}
        gradientFrom={THEME.gradientFrom}
        gradientTo={THEME.gradientTo}
        onCancel={onClose}
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default JoinBandForm;
