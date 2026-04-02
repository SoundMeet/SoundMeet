import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

import ChipSelector from "../ui/ChipSelector";
import SearchableTagSection from "../ui/SearchableTagSection";
import InfoTooltip from "../ui/InfoTooltip";
import {
  genreOptions,
  instrumentOptions,
  vibeOptions,
  skillLevelOptions,
  jamTypeOptions,
  rolesOptions,
  equipmentAvailableOptions,
  equipmentNeededOptions,
  privacyOptions,
} from "../../data/jamFormOptions";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Core Details" },
  { number: 2, label: "Style & Lineup" },
  { number: 3, label: "Setup & Details" },
];

/** Initial state for a TagGroupState (preset IDs + custom free-text values) */
const tagGroup = () => ({ presetIds: [], customValues: [] });

const INITIAL_FORM = {
  // Step 1
  title: "",
  date: "",
  startTime: "",
  location: "",
  isPublic: true,
  // Step 2 — Style & Lineup
  genres: tagGroup(),
  vibes: tagGroup(),
  jamTypes: tagGroup(),
  instrumentsNeeded: tagGroup(),
  rolesNeeded: tagGroup(),
  // Step 3 — Setup & Details
  equipmentAvailable: tagGroup(),
  equipmentNeeded: tagGroup(),
  description: "",
  skillLevel: null,
  maxParticipants: "",
  notes: "",
  // "All accepted" wildcard flags
  acceptsAllGenres: false,
  acceptsAllVibes: false,
  acceptsAllInstruments: false,
};

// ─── TagGroup helpers (module-level, no closure deps) ─────────────────────────

/**
 * Returns the three handler callbacks needed by SearchableTagSection for
 * a given tag-group field. Requires setForm from the parent component.
 */
const makeTagHandlers = (setForm, field) => ({
  onTogglePreset: (id) =>
    setForm((prev) => {
      const g = prev[field];
      const ids = g.presetIds.includes(id)
        ? g.presetIds.filter((i) => i !== id)
        : [...g.presetIds, id];
      return { ...prev, [field]: { ...g, presetIds: ids } };
    }),
  onAddCustom: (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        customValues: [...prev[field].customValues, val],
      },
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

// ─── Internal primitives ──────────────────────────────────────────────────────

const Field = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
        {required && (
          <span style={{ color: "#DC2E73" }} aria-hidden>
            *
          </span>
        )}
      </label>
    )}
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-xs"
          style={{ color: "#FB4040" }}
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const GroupHeading = ({ children }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-[0.14em] pt-1 pb-0.5"
    style={{ color: "rgba(229,226,225,0.2)" }}
  >
    {children}
  </p>
);

const StepIndicator = ({ step }) => (
  <div className="flex items-center gap-1.5">
    {STEPS.map((s) => (
      <motion.div
        key={s.number}
        animate={{
          width: step === s.number ? 24 : 8,
          opacity: s.number > step ? 0.2 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: 8,
          borderRadius: 9999,
          background:
            s.number <= step
              ? "linear-gradient(to right, #DC2E73, #FB4040)"
              : "rgba(255,255,255,0.15)",
        }}
      />
    ))}
  </div>
);

const Stepper = ({ value, onChange }) => {
  const num = parseInt(value) || 0;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, num - 1)))}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
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
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
        style={{
          background: "#2A2A2A",
          color: "rgba(229,226,225,0.7)",
        }}
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

/**
 * AllAcceptedToggle — wildcard chip for "accept everything" in a section.
 * When active it signals the host doesn't need a specific selection.
 */
const AllAcceptedToggle = ({ active, label, onToggle }) => (
  <motion.button
    type="button"
    onClick={onToggle}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.12, ease: "easeOut" }}
    className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide select-none"
    style={{
      background: active ? "rgba(220,46,115,0.15)" : "rgba(255,255,255,0.04)",
      color: active ? "#DC2E73" : "rgba(229,226,225,0.35)",
      boxShadow: active
        ? "0 0 0 1px rgba(220,46,115,0.35)"
        : "0 0 0 1px rgba(255,255,255,0.08)",
      transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
    }}
  >
    <span style={{ fontSize: 10, lineHeight: 1, opacity: active ? 1 : 0.5 }}>
      {active ? "✓" : "✦"}
    </span>
    {label}
  </motion.button>
);

// ─── Step panels ──────────────────────────────────────────────────────────────

const Step1 = ({ form, set, errors, touched, handleBlur }) => (
  <div className="space-y-4">
    <Field label="Jam Title" required error={touched.title && errors.title}>
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Sunday Jazz Rooftop Session"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        onBlur={() => handleBlur("title")}
        autoFocus
      />
    </Field>

    <div className="grid grid-cols-2 gap-3">
      <Field label="Date" required error={touched.date && errors.date}>
        <input
          type="date"
          className="jam-input"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          onBlur={() => handleBlur("date")}
        />
      </Field>
      <Field
        label="Start Time"
        required
        error={touched.startTime && errors.startTime}
      >
        <input
          type="time"
          className="jam-input"
          value={form.startTime}
          onChange={(e) => set("startTime", e.target.value)}
          onBlur={() => handleBlur("startTime")}
        />
      </Field>
    </div>

    <Field
      label="Location"
      required
      error={touched.location && errors.location}
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Tompkins Square Park, NYC"
        value={form.location}
        onChange={(e) => set("location", e.target.value)}
        onBlur={() => handleBlur("location")}
      />
    </Field>

    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          Visibility
        </span>
        <InfoTooltip
          content={
            form.isPublic
              ? "Public — visible on the map. Anyone can join."
              : "Private — hidden from the map. Invite-only."
          }
        />
      </div>
      <div className="flex rounded-xl p-1" style={{ background: "#1C1B1B" }}>
        {privacyOptions.map((opt) => {
          const active = (opt.id === "public") === form.isPublic;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => set("isPublic", opt.id === "public")}
              className="relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                background: active
                  ? "linear-gradient(135deg, #DC2E73, #FB4040)"
                  : "transparent",
                color: active ? "#ffffff" : "rgba(229,226,225,0.3)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p
        className="text-xs mt-1.5 ml-1 transition-all duration-200"
        style={{ color: "rgba(229,226,225,0.28)" }}
      >
        {form.isPublic
          ? privacyOptions[0].description
          : privacyOptions[1].description}
      </p>
    </div>
  </div>
);

const Step2 = ({ form, set, setForm }) => {
  const genreH = makeTagHandlers(setForm, "genres");
  const vibeH = makeTagHandlers(setForm, "vibes");
  const jamTypeH = makeTagHandlers(setForm, "jamTypes");
  const instrumentH = makeTagHandlers(setForm, "instrumentsNeeded");
  const rolesH = makeTagHandlers(setForm, "rolesNeeded");

  return (
    <div className="space-y-5">
      {/* ── STYLE & LINEUP ───────────────────────────────────────────── */}
      <GroupHeading>Style &amp; Lineup</GroupHeading>

      {/* Genres */}
      <div>
        <AllAcceptedToggle
          active={form.acceptsAllGenres}
          label="All Genres Welcome"
          onToggle={() => {
            const next = !form.acceptsAllGenres;
            set("acceptsAllGenres", next);
            if (next)
              setForm((p) => ({
                ...p,
                genres: { ...p.genres, presetIds: [] },
              }));
          }}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.acceptsAllGenres ? 0.3 : 1,
            pointerEvents: form.acceptsAllGenres ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Genres"
            placeholder="Search genres…"
            options={genreOptions}
            presetIds={form.genres.presetIds}
            customValues={form.genres.customValues}
            {...genreH}
            maxVisible={10}
          />
        </div>
      </div>

      {/* Vibe */}
      <div>
        <AllAcceptedToggle
          active={form.acceptsAllVibes}
          label="All Vibes Welcome"
          onToggle={() => {
            const next = !form.acceptsAllVibes;
            set("acceptsAllVibes", next);
            if (next)
              setForm((p) => ({
                ...p,
                vibes: { ...p.vibes, presetIds: [] },
              }));
          }}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.acceptsAllVibes ? 0.3 : 1,
            pointerEvents: form.acceptsAllVibes ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Vibe"
            placeholder="Search vibes…"
            options={vibeOptions}
            presetIds={form.vibes.presetIds}
            customValues={form.vibes.customValues}
            {...vibeH}
            maxVisible={8}
          />
        </div>
      </div>

      {/* Jam Type */}
      <SearchableTagSection
        title="Jam Type"
        placeholder="Search jam types…"
        options={jamTypeOptions}
        presetIds={form.jamTypes.presetIds}
        customValues={form.jamTypes.customValues}
        {...jamTypeH}
        maxVisible={6}
      />

      {/* ── PEOPLE ────────────────────────────────────────────────────── */}
      <GroupHeading>People</GroupHeading>

      {/* Instruments Needed */}
      <div>
        <AllAcceptedToggle
          active={form.acceptsAllInstruments}
          label="All Instruments Welcome"
          onToggle={() => {
            const next = !form.acceptsAllInstruments;
            set("acceptsAllInstruments", next);
            if (next)
              setForm((p) => ({
                ...p,
                instrumentsNeeded: { ...p.instrumentsNeeded, presetIds: [] },
              }));
          }}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.acceptsAllInstruments ? 0.3 : 1,
            pointerEvents: form.acceptsAllInstruments ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Instruments Needed"
            placeholder="Search instruments…"
            options={instrumentOptions}
            presetIds={form.instrumentsNeeded.presetIds}
            customValues={form.instrumentsNeeded.customValues}
            {...instrumentH}
            maxVisible={10}
          />
        </div>
      </div>

      {/* Roles Needed */}
      <SearchableTagSection
        title="Roles Needed"
        placeholder="Search roles…"
        options={rolesOptions}
        presetIds={form.rolesNeeded.presetIds}
        customValues={form.rolesNeeded.customValues}
        {...rolesH}
        maxVisible={8}
        helperText="More specific than instruments — e.g. Lead Guitarist, Backing Vocalist."
      />
    </div>
  );
};

const Step3 = ({ form, set, setForm }) => {
  const equipAvailH = makeTagHandlers(setForm, "equipmentAvailable");
  const equipNeededH = makeTagHandlers(setForm, "equipmentNeeded");

  return (
    <div className="space-y-4">
      {/* ── GEAR & SETUP ─────────────────────────────────────────────── */}
      <GroupHeading>Gear &amp; Setup</GroupHeading>

      <SearchableTagSection
        title="Available at Jam"
        placeholder="Search equipment…"
        options={equipmentAvailableOptions}
        presetIds={form.equipmentAvailable.presetIds}
        customValues={form.equipmentAvailable.customValues}
        {...equipAvailH}
        maxVisible={8}
        helperText="Gear already at the venue that attendees can use."
      />

      <SearchableTagSection
        title="Need People to Bring"
        placeholder="Search gear to bring…"
        options={equipmentNeededOptions}
        presetIds={form.equipmentNeeded.presetIds}
        customValues={form.equipmentNeeded.customValues}
        {...equipNeededH}
        maxVisible={8}
        helperText="Gear attendees should bring for the jam to work."
      />

      {/* ── SESSION DETAILS ───────────────────────────────────────────── */}
      <GroupHeading>Session Details</GroupHeading>

      <Field label="Description">
        <textarea
          rows={3}
          className="jam-input resize-none"
          style={{ borderRadius: "0.75rem" }}
          placeholder="Tell musicians what to expect…"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2.5"
          style={{ color: "rgba(229,226,225,0.35)" }}
        >
          Skill Level
        </p>
        <ChipSelector
          options={skillLevelOptions}
          selected={form.skillLevel ? [form.skillLevel] : []}
          onChange={(v) => set("skillLevel", v[v.length - 1] ?? null)}
          shape="rounded"
        />
      </div>

      <Field label="Max Participants">
        <Stepper
          value={form.maxParticipants}
          onChange={(v) => set("maxParticipants", v)}
        />
      </Field>

      <Field label="Notes">
        <textarea
          rows={2}
          className="jam-input resize-none"
          style={{ borderRadius: "0.75rem" }}
          placeholder="Anything else?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>
    </div>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

const CreateJamModal = ({ open, onOpenChange }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(1);
        setForm(INITIAL_FORM);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateField = (field, value) => {
    if (field === "title" && !String(value).trim()) return "Title is required";
    if (field === "date" && !value) return "Date is required";
    if (field === "startTime" && !value) return "Start time is required";
    if (field === "location" && !String(value).trim())
      return "Location is required";
    return null;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field]),
    }));
  };

  const validateStep1 = () => {
    const fields = ["title", "date", "startTime", "location"];
    const newErrors = {};
    let valid = true;
    fields.forEach((f) => {
      const e = validateField(f, form[f]);
      if (e) {
        newErrors[f] = e;
        valid = false;
      }
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setTouched((prev) => ({
      ...prev,
      title: true,
      date: true,
      startTime: true,
      location: true,
    }));
    return valid;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    console.log("🎵 Create Jam:", form);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const step1Valid =
    form.title.trim() && form.date && form.startTime && form.location.trim();

  const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(220,46,115,0.08) 0%, rgba(0,0,0,0.74) 100%)",
            animation: "jamOverlayIn 0.22s ease forwards",
          }}
        />

        <Dialog.Content
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center outline-none"
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-[560px] flex flex-col overflow-hidden
              rounded-t-[1.5rem] max-h-[92vh]
              md:rounded-[1.5rem] md:max-h-[88vh]"
            style={{
              pointerEvents: "auto",
              background: "rgba(20,20,20,0.95)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              boxShadow:
                "0 0 60px rgba(229,226,225,0.03), 0 0 50px rgba(220,46,115,0.1), 0 -1px 0 rgba(220,46,115,0.07)",
            }}
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
              <div>
                <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                  Create a Jam
                </Dialog.Title>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: "rgba(229,226,225,0.32)" }}
                >
                  {STEPS[step - 1].label}
                </p>
              </div>

              <StepIndicator step={step} />

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

            {/* ── Scrollable body ───────────────────────────────────────── */}
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
                    <Step1
                      form={form}
                      set={set}
                      errors={errors}
                      touched={touched}
                      handleBlur={handleBlur}
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
                    <Step2 form={form} set={set} setForm={setForm} />
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
                    <Step3 form={form} set={set} setForm={setForm} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div
              className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(220,46,115,0.07)" }}
            >
              <button
                onClick={step === 1 ? () => onOpenChange(false) : goBack}
                className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(229,226,225,0.5)",
                }}
              >
                {step === 1 ? "Cancel" : "← Back"}
              </button>

              {step < 3 ? (
                <button
                  onClick={goNext}
                  disabled={step === 1 && !step1Valid}
                  className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #DC2E73, #FB4040)",
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #DC2E73, #FB4040)",
                  }}
                >
                  {isSubmitting ? "Creating…" : "Create Jam"}
                </button>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CreateJamModal;
