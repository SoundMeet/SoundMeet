import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import ShowBasicInfoSection from "./sections/ShowBasicInfoSection";
import ShowVenueSection from "./sections/ShowVenueSection";
import ShowDetailsSection from "./sections/ShowDetailsSection";
import PromoteShowFooterActions from "./PromoteShowFooterActions";
import StepIndicator from "../ui/StepIndicator";
import { showService } from "../../injectables/showService";
import { getFormTheme } from "../../utils/discovery";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Core Info" },
  { number: 2, label: "Venue"     },
  { number: 3, label: "Details"   },
];

const THEME = getFormTheme("promote_show");

// ─── Form state ───────────────────────────────────────────────────────────────

const tagGroup = () => ({ selectedIds: [], customValues: [] });

const INITIAL_FORM = {
  title:         "",
  date:          "",
  startTime:     "",
  endTime:       "",
  locationQuery: "",
  selectedPlace: null,
  locationGuide: "",
  genres:        tagGroup(),
  ticketPrice:   "",
  ticketLink:    "",
  description:   "",
  maxCapacity:   "",
  isPrivate:     false,

  // Lineup: [{ id: string, name: string, role: string }]
  // Backend: store as jsonb column `lineup` on the show/event record.
  // Strip the `id` field before sending — it's a frontend-only React key.
  lineup: [],

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

// ─── PromoteShowForm ──────────────────────────────────────────────────────────

/**
 * PromoteShowForm — owns all form state and step navigation.
 *
 * Props:
 *   options  PromoteShowOptionSets — provided by PromoteShowModal via useFormOptions()
 *   onClose  () => void
 */
const PromoteShowForm = ({ options, onClose, initialValues }) => {
  const isEditMode = !!initialValues;
  const [form,         setForm]         = useState({ ...INITIAL_FORM, ...(initialValues ?? {}) });
  const [step,         setStep]         = useState(1);
  const [direction,    setDirection]    = useState(1);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Location helpers ───────────────────────────────────────────────────────

  const handlePlaceSelect = (place) =>
    setForm((prev) => ({
      ...prev,
      selectedPlace: place,
      locationQuery: place.placeName,
    }));

  const handlePlaceClear = () =>
    setForm((prev) => ({ ...prev, selectedPlace: null, locationQuery: "" }));

  const handleLocationUpdate = ({ latitude, longitude }) => {
    if (!form.selectedPlace) return;
    setField("selectedPlace", { ...form.selectedPlace, latitude, longitude });
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title     = "Show title is required";
    if (!form.date)         newErrors.date      = "Date is required";
    if (!form.startTime)    newErrors.startTime = "Start time is required";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.selectedPlace) newErrors.selectedPlace = "Please search and select a venue";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    if (step === 2) valid = validateStep2();
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
    if (step === 1) return !!form.title.trim() && !!form.date && !!form.startTime;
    if (step === 2) return !!form.selectedPlace;
    return true;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await showService.updateShow(initialValues.showId, form);
      } else {
        await showService.createShow(form);
      }
      onClose();
    } catch (err) {
      console.error("Promote show failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tag handlers ───────────────────────────────────────────────────────────

  const tagHandlers = {
    genres: makeTagHandlers(setForm, "genres"),
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div>
          <Dialog.Title className="text-xl font-bold text-white tracking-tight">
            {isEditMode ? "Edit Show" : "Promote a Show"}
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
              <ShowBasicInfoSection
                form={form}
                errors={errors}
                onChange={setField}
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
              <ShowVenueSection
                form={form}
                errors={errors}
                onChange={setField}
                onPlaceSelect={handlePlaceSelect}
                onPlaceClear={handlePlaceClear}
                onLocationUpdate={handleLocationUpdate}
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
              <ShowDetailsSection
                form={form}
                options={options}
                onChange={setField}
                tagHandlers={tagHandlers}
                accent={THEME.accent}
                gradientFrom={THEME.gradientFrom}
                gradientTo={THEME.gradientTo}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {submitError && (
        <p className="text-xs text-center px-6 pb-2 flex-shrink-0" style={{ color: '#fb4040', fontFamily: 'Sora, sans-serif' }}>
          {submitError}
        </p>
      )}
      <PromoteShowFooterActions
        step={step}
        totalSteps={STEPS.length}
        canAdvance={canAdvance}
        isSubmitting={isSubmitting}
        gradientFrom={THEME.gradientFrom}
        gradientTo={THEME.gradientTo}
        submitLabel={isEditMode ? "Save Changes" : undefined}
        onCancel={onClose}
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default PromoteShowForm;
