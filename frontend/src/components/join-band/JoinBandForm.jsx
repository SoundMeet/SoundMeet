import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import MusicianAboutSection       from "./sections/MusicianAboutSection";
import MusicianWhatYouPlaySection from "./sections/MusicianWhatYouPlaySection";
import MusicianStyleFitSection    from "./sections/MusicianStyleFitSection";
import MusicianLookingForSection  from "./sections/MusicianLookingForSection";
import MusicianLinksMediaSection  from "./sections/MusicianLinksMediaSection";
import ListingPreferencesSection  from "./sections/ListingPreferencesSection";
import JoinBandFooterActions      from "./JoinBandFooterActions";
import StepIndicator              from "../ui/StepIndicator";
import { buildJoinBandPayload }   from "../../utils/buildJoinBandPayload";
import { getFormTheme }           from "../../utils/discovery";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "About You"     },
  { number: 2, label: "What You Play" },
  { number: 3, label: "Style & Fit"   },
  { number: 4, label: "Looking For"   },
  { number: 5, label: "Links & Media" },
  { number: 6, label: "Preferences"   },
];

const THEME = getFormTheme("join_band");

// ─── Form state ───────────────────────────────────────────────────────────────

const tagGroup = () => ({ selectedIds: [], customValues: [] });

/**
 * Build initial form state, prefilling profile-sourced values.
 *
 * @param {object} profile — { name, city, photoUrl } from the user's SoundMeet profile
 */
const makeInitialForm = (profile) => ({
  // § 1 — About You (listing overrides on top of profile)
  artistName:    "",    // optional display name override; falls back to profile.name
  photo:         null,  // { file, previewUrl } | null — overrides profile photo
  // Location — unified shape; city text extracted on submit via placeToOpportunityAreaText()
  locationQuery: "",
  selectedPlace: null,
  headline:      "",
  bio:           "",

  // § 2 — What You Play
  primaryRole:    null,
  secondaryRoles: tagGroup(),
  instruments:    tagGroup(),
  skillLevel:     null,
  yearsPlaying:   null,
  experience:     [],
  gear:           "",
  vocals:         null,

  // § 3 — Style & Fit
  genres:          tagGroup(),
  vibes:           tagGroup(),
  influences:      tagGroup(),
  coversOriginals: null,

  // § 4 — Looking For
  opportunityTypes: [],
  commitment:       null,
  availability:     [],
  travelRadius:     null,
  paidStatus:       null,

  // § 5 — Links & Media
  featuredLink:     "",
  audioLink:        "",
  videoLink:        "",
  instagram:        "",
  youtube:          "",
  spotifyOrWebsite: "",

  // § 6 — Listing Preferences
  listingStatus:      null,
  openTo:             [],
  collaborationScope: null,
});

// ─── Tag handler factory ──────────────────────────────────────────────────────

const makeTagHandlers = (setForm, field) => ({
  onTogglePreset: (id) =>
    setForm((prev) => {
      const g   = prev[field];
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
 * JoinBandForm — Join a Band listing builder.
 *
 * This form creates a discoverable musician listing built on top of the
 * user's existing SoundMeet profile. It is not a standalone profile creator.
 *
 * Props:
 *   profile  { name, city, photoUrl }  — current user's SoundMeet profile data
 *   options  JoinBandOptionSets        — provided by JoinBandModal via useFormOptions()
 *   onClose  () => void
 */
const JoinBandForm = ({
  profile = {},
  options,
  onClose,
}) => {
  const [form,         setForm]         = useState(() => makeInitialForm(profile));
  const [step,         setStep]         = useState(1);
  const [direction,    setDirection]    = useState(1);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Location handlers ──────────────────────────────────────────────────────

  const handlePlaceSelect = (place) =>
    setForm((prev) => ({ ...prev, selectedPlace: place, locationQuery: place.placeName }));

  const handlePlaceClear = () =>
    setForm((prev) => ({ ...prev, selectedPlace: null, locationQuery: "" }));

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.selectedPlace && !form.locationQuery.trim()) {
      newErrors.selectedPlace = "City or area is required for local matching";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (n) => {
    if (n >= step) return;
    setDirection(-1);
    setStep(n);
  };

  const canAdvance = step !== 1 || !!(form.selectedPlace || form.locationQuery.trim());

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = buildJoinBandPayload(form, profile);
    try {
      // TODO: wire up real API call — e.g. await api.createJoinBandListing(payload)
      await new Promise((r) => setTimeout(r, 900));
      onClose();
    } catch (err) {
      console.error("Listing post failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tag handlers ───────────────────────────────────────────────────────────

  const tagHandlers = {
    secondaryRoles: makeTagHandlers(setForm, "secondaryRoles"),
    instruments:    makeTagHandlers(setForm, "instruments"),
    genres:         makeTagHandlers(setForm, "genres"),
    vibes:          makeTagHandlers(setForm, "vibes"),
    influences:     makeTagHandlers(setForm, "influences"),
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
                color:      "rgba(229,226,225,0.45)",
                fontSize:   "16px",
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
              <MusicianAboutSection
                form={form}
                errors={errors}
                profile={profile}
                onChange={setField}
                onPlaceSelect={handlePlaceSelect}
                onPlaceClear={handlePlaceClear}
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
              <MusicianWhatYouPlaySection
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
              <MusicianStyleFitSection
                form={form}
                options={options}
                onChange={setField}
                tagHandlers={tagHandlers}
                accent={THEME.accent}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <MusicianLookingForSection
                form={form}
                options={options}
                onChange={setField}
                accent={THEME.accent}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step-5"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <MusicianLinksMediaSection
                form={form}
                onChange={setField}
              />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step-6"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ListingPreferencesSection
                form={form}
                options={options}
                onChange={setField}
                accent={THEME.accent}
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
