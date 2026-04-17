import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import JamBasicInfoSection from "./sections/JamBasicInfoSection";
import JamLocationSection from "./sections/JamLocationSection";
import JamTaxonomySection from "./sections/JamTaxonomySection";
import CreateJamFooterActions from "./CreateJamFooterActions";
import StepIndicator from "../ui/StepIndicator";
import ImageUploadField from "../ui/ImageUploadField";
import { getFormTheme } from "../../utils/discovery";
import { Field } from "./sections/JamBasicInfoSection";
import {
  validateJamCoreDetails,
  validateJamField,
} from "../../utils/validateJamCoreDetails";
import { jamService } from "../../injectables/jamService";
import { useAuth } from "../../injectables/Auth";

// ─── Steps definition ─────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Core Details"   },
  { number: 2, label: "Location"       },
  { number: 3, label: "Style & Lineup" },
];

const THEME = getFormTheme("jam");

// ─── Initial form state ───────────────────────────────────────────────────────

const tagGroup = () => ({ presetIds: [], customValues: [] });

const INITIAL_FORM = {
  // Basic info
  title:     "",
  date:      "",
  startTime: "",
  endTime:   "",

  // Location
  locationQuery: "",
  selectedPlace: null,
  locationGuide: "",

  // Taxonomy
  genres:             tagGroup(),
  vibes:              tagGroup(),
  instrumentsNeeded:  tagGroup(),
  jamTypes:           tagGroup(),
  rolesNeeded:        tagGroup(),
  equipmentAvailable: tagGroup(),
  equipmentNeeded:    tagGroup(),
  skillLevel:         null,

  // "Open to all" flags
  isOpenToAllGenres:      false,
  isOpenToAllVibes:       false,
  isOpenToAllInstruments: false,

  // Details
  description: "",

  // Participation
  maxParticipants: "",
  isPrivate:       false,

  // Media
  // coverImage: { file: File, previewUrl: string } | null
  // Backend: upload file to Supabase Storage, store returned URL as cover_image_url
  coverImage: null,
};

// ─── Slide animation variants ─────────────────────────────────────────────────

const stepVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ?  24 : -24 }),
  center:            { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -24 :  24 }),
};

// ─── Stepper (max participants) ────────────────────────────────────────────────

const Stepper = ({ value, onChange }) => {
  const num = parseInt(value) || 0;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, num - 1)))}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
        style={{
          background: "#2A2A2A",
          color: num > 0 ? "rgba(229,226,225,0.7)" : "rgba(229,226,225,0.2)",
        }}
      >
        −
      </button>
      <input
        type="number"
        min={0}
        className="jam-input text-center"
        style={{ width: "5rem" }}
        placeholder="∞"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => onChange(String(num + 1))}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
        style={{ background: "#2A2A2A", color: "rgba(229,226,225,0.7)" }}
      >
        +
      </button>
      <span
        className="text-[11px] leading-tight"
        style={{ color: "rgba(229,226,225,0.25)" }}
      >
        Blank = unlimited
      </span>
    </div>
  );
};

// ─── CreateJamForm ────────────────────────────────────────────────────────────

/**
 * CreateJamForm — owns all form state and step navigation.
 *
 * Props:
 *   options        CreateJamOptionSets  — provided by CreateJamModal via useFormOptions()
 *   onClose        () => void
 *   onJamCreated   (jamId: string, title: string, isPrivate: boolean) => void  — create mode only
 *   initialValues  object?              — pre-fills form for edit mode
 */
const CreateJamForm = ({
  options,
  onClose,
  onJamCreated,
  initialValues,
  firstJam,
}) => {
  const isEditMode = !!initialValues;
  const { user } = useAuth();
  const [form,        setForm]        = useState({ ...INITIAL_FORM, ...(initialValues ?? {}) });
  const [step,        setStep]        = useState(1);
  const [direction,   setDirection]   = useState(1);
  const [errors,      setErrors]      = useState({});
  const [touched,     setTouched]     = useState({});
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [submitError,  setSubmitError]  = useState(null);

  // ── Field update helpers ───────────────────────────────────────────────────

  const setField = (field, value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    const deps = [];
    if (field === "date")      deps.push("startTime", "endTime");
    if (field === "startTime") deps.push("endTime");

    setErrors((prev) => {
      const updated = { ...prev, [field]: validateJamField(field, nextForm) };
      deps.forEach((dep) => {
        if (touched[dep] || nextForm[dep]) {
          updated[dep] = validateJamField(dep, nextForm);
        }
      });
      return updated;
    });
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateJamField(field, form) }));
  };

  // ── Location helpers ───────────────────────────────────────────────────────

  const handlePlaceSelect = (place) => {
    setForm((prev) => ({ ...prev, selectedPlace: place, locationQuery: place.placeName }));
    if (errors.selectedPlace) setErrors((p) => ({ ...p, selectedPlace: null }));
  };

  const handlePlaceClear = () => {
    setForm((prev) => ({ ...prev, selectedPlace: null, locationQuery: "" }));
  };

  const handleLocationUpdate = ({ latitude, longitude }) => {
    if (!form.selectedPlace) return;
    setField("selectedPlace", { ...form.selectedPlace, latitude, longitude });
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const { errors: newErrors, isValid } = validateJamCoreDetails(form);
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setTouched((prev) => ({
      ...prev,
      title: true,
      date: true,
      startTime: true,
      endTime: !!form.endTime,
    }));
    return isValid;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.selectedPlace) {
      newErrors.selectedPlace = "Please search and select a location";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Style & Lineup fields are optional — the DB only stores genre_id / vibe_id
  // (single FKs), so we never hard-block on missing selections here.
  const validateStep3 = () => true;

  // ── Step navigation ────────────────────────────────────────────────────────

  const goNext = () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    if (step === 2) valid = validateStep2();
    if (step === 3) valid = validateStep3();
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
    if (n >= step) return; // only allow going backward
    setDirection(-1);
    setStep(n);
  };

  const canAdvance = (() => {
    if (step === 1) {
      const { isValid } = validateJamCoreDetails(form);
      return isValid;
    }
    if (step === 2) return !!form.selectedPlace;
    return true;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitError(null);
    if (!user?.id) {
      setSubmitError("Session error — please log out and log back in.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await jamService.updateJam(initialValues.jamId, form);
        onClose();
      } else {
        const result = await jamService.createJam(form, user.id);
        localStorage.setItem("sm_has_created_jam", "1");
        if (onJamCreated) {
          onJamCreated(String(result.jam_id), form.title, form.isPrivate);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error("Create jam failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div>
          <Dialog.Title className="text-xl font-bold text-white tracking-tight">
            {isEditMode ? "Edit Jam" : firstJam ? "Let's set up your jam" : "Create a Jam"}
          </Dialog.Title>
          <p
            className="text-[10px] font-medium uppercase tracking-[0.12em] mt-0.5"
            style={{ color: "rgba(229,226,225,0.32)" }}
          >
            {firstJam && step === 1
              ? "Just a few details to get started"
              : STEPS[step - 1].label}
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
              className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 flex-shrink-0"
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

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-6 pb-5"
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
              <JamBasicInfoSection
                form={form}
                errors={errors}
                touched={touched}
                onChange={setField}
                onBlur={handleBlur}
                firstJam={firstJam}
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
              <JamLocationSection
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
              <div className="space-y-6">
                {/* Event photo — optional poster/vibe image */}
                <ImageUploadField
                  label="Event Photo"
                  hint="Optional — a vibe shot or promo image for your jam"
                  value={form.coverImage}
                  onChange={(v) => setField("coverImage", v)}
                  accent={THEME.accent}
                />

                <JamTaxonomySection
                  form={form}
                  options={options}
                  errors={errors}
                  onChange={setField}
                  setForm={setForm}
                  accent={THEME.accent}
                  firstJam={firstJam}
                />

                {/* Description + participation at the bottom of the last step */}
                <div className="space-y-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Field label="Description">
                    <textarea
                      rows={3}
                      className="jam-input resize-none"
                      style={{ borderRadius: "0.75rem" }}
                      placeholder="Tell musicians what to expect…"
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                    />
                  </Field>

                  <Field label="Max Participants">
                    <Stepper
                      value={form.maxParticipants}
                      onChange={(v) => setField("maxParticipants", v)}
                    />
                  </Field>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      {submitError && (
        <p
          className="text-xs text-center px-6 pb-2 flex-shrink-0"
          style={{ color: '#fb4040', fontFamily: 'Sora, sans-serif' }}
        >
          {submitError}
        </p>
      )}
      <CreateJamFooterActions
        step={step}
        totalSteps={STEPS.length}
        canAdvance={canAdvance}
        isSubmitting={isSubmitting}
        gradientFrom={THEME.gradientFrom}
        gradientTo={THEME.gradientTo}
        submitLabel={isEditMode ? "Save Changes" : "Create Jam"}
        onCancel={onClose}
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default CreateJamForm;
