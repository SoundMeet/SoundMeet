import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import BandmateBasicSection from "./sections/BandmateBasicSection";
import BandmateMusicSection from "./sections/BandmateMusicSection";
import BandmatePreferencesSection from "./sections/BandmatePreferencesSection";
import FindBandmateFooterActions from "./FindBandmateFooterActions";
import StepIndicator from "../ui/StepIndicator";
import { buildFindBandmatePayload } from "../../utils/buildFindBandmatePayload";
import { getFormTheme } from "../../utils/discovery";
import { useAuth } from "../../injectables/Auth";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Band / Project Basics" },
  { number: 2, label: "Sound & Identity"       },
  { number: 3, label: "The Opening"            },
];

const THEME = getFormTheme("find_bandmate");

// ─── Form state ───────────────────────────────────────────────────────────────

const tagGroup = () => ({ selectedIds: [], customValues: [] });

const buildInitialForm = (user) => ({
  // Step 1 — Band / Project Basics
  bandProjectName: "",
  postedByUserId:  user?.id   ?? null,
  postedByName:    user?.username ?? user?.email ?? "",
  cityArea:        "",
  coverImage:      null,   // { file: File, previewUrl: string } | null
  headline:        "",
  aboutProject:    "",

  // Step 2 — Sound & Identity
  genres:        tagGroup(),
  vibe:          tagGroup(),
  influences:    tagGroup(),
  coversOriginals: null,
  currentLineup: tagGroup(),
  projectLevel:  null,

  // Step 3 — The Opening
  rolesNeeded:       tagGroup(),
  skillLevelDesired: null,
  availability:      tagGroup(),
  commitmentLevel:   null,
  whatLookingFor:    "",
  contactInfo:       "",
});

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

// ─── FindBandmateForm ─────────────────────────────────────────────────────────

/**
 * FindBandmateForm — owns all form state and step navigation for the
 * "Find a Bandmate" band/project recruitment listing flow.
 *
 * Props:
 *   options  FindBandmateOptionSets — provided by FindBandmateModal via useFormOptions()
 *   onClose  () => void
 */
const FindBandmateForm = ({ options, onClose }) => {
  const { user } = useAuth();
  const [form,         setForm]         = useState(() => buildInitialForm(user));
  const [step,         setStep]         = useState(1);
  const [direction,    setDirection]    = useState(1);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.bandProjectName.trim()) newErrors.bandProjectName = "Band or project name is required";
    if (!form.cityArea.trim())        newErrors.cityArea        = "City or area is required";
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
    if (step === 1) return !!form.bandProjectName.trim() && !!form.cityArea.trim();
    return true;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = buildFindBandmatePayload(form);
    try {
      // TODO: wire up real API call — e.g. await api.findBandmate(payload)
      await new Promise((r) => setTimeout(r, 900));
      onClose();
    } catch (err) {
      console.error("Find bandmate failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tag handlers ───────────────────────────────────────────────────────────

  const tagHandlers = {
    genres:        makeTagHandlers(setForm, "genres"),
    vibe:          makeTagHandlers(setForm, "vibe"),
    influences:    makeTagHandlers(setForm, "influences"),
    currentLineup: makeTagHandlers(setForm, "currentLineup"),
    rolesNeeded:   makeTagHandlers(setForm, "rolesNeeded"),
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div>
          <Dialog.Title className="text-xl font-bold text-white tracking-tight">
            Find a Bandmate
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
              <BandmateBasicSection
                form={form}
                errors={errors}
                onChange={setField}
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
              <BandmateMusicSection
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
              <BandmatePreferencesSection
                form={form}
                options={options}
                onChange={setField}
                tagHandlers={tagHandlers}
                accent={THEME.accent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <FindBandmateFooterActions
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

export default FindBandmateForm;
