/**
 * JamInlineEditForm — pure presentational edit form rendered inside the jam
 * detail modal when the creator enters edit mode.
 *
 * All state is owned by EventDetailModal and passed as props.
 * This component just renders the fields and wires the callbacks.
 *
 * Reuses field components from the create-jam flow verbatim:
 *   JamBasicInfoSection, JamLocationSection, JamTaxonomySection,
 *   ImageUploadField, Field wrapper.
 */

import { motion } from "framer-motion";
import JamBasicInfoSection, { Field } from "../create-jam/sections/JamBasicInfoSection";
import JamLocationSection from "../create-jam/sections/JamLocationSection";
import JamTaxonomySection from "../create-jam/sections/JamTaxonomySection";
import ImageUploadField from "../ui/ImageUploadField";
import { validateJamField } from "../../utils/validateJamCoreDetails";
import { getFormTheme } from "../../utils/discovery";

const THEME = getFormTheme("jam");

// ─── Section header ───────────────────────────────────────────────────────────

const EditSectionHeader = ({ children }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
    style={{ color: "rgba(229,226,225,0.22)" }}
  >
    {children}
  </p>
);

// ─── Section divider ──────────────────────────────────────────────────────────

const SectionDivider = () => (
  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

// ─── Participant stepper (mirrors CreateJamForm's Stepper) ────────────────────

const Stepper = ({ value, onChange }) => {
  const num = parseInt(value) || 0;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, num - 1)))}
        className="w-11 h-11 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
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
        className="w-11 h-11 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-light transition-colors duration-150"
        style={{ background: "#2A2A2A", color: "rgba(229,226,225,0.7)" }}
      >
        +
      </button>
      <span className="text-[11px] leading-tight" style={{ color: "rgba(229,226,225,0.25)" }}>
        Blank = unlimited
      </span>
    </div>
  );
};

// ─── JamInlineEditForm ────────────────────────────────────────────────────────

/**
 * Props:
 *   form        — full form state (owned by EventDetailModal)
 *   setForm     — (updater | nextForm) => void
 *   errors      — field error map
 *   setErrors   — (updater | nextErrors) => void
 *   touched     — field touched map
 *   setTouched  — (updater | nextTouched) => void
 *   options     — { genres, vibes, instruments, jamTypes, skillLevels, … } from useFormOptions
 */
const JamInlineEditForm = ({
  form,
  setForm,
  errors,
  setErrors,
  touched,
  setTouched,
  options,
}) => {
  // ── Field update with cross-field validation ───────────────────────────────

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

  // ── Location callbacks ─────────────────────────────────────────────────────

  const handlePlaceSelect = (place) => {
    setForm((prev) => ({ ...prev, selectedPlace: place, locationQuery: place.placeName }));
    setErrors((prev) => ({ ...prev, selectedPlace: null }));
  };

  const handlePlaceClear = () => {
    setForm((prev) => ({ ...prev, selectedPlace: null, locationQuery: "" }));
  };

  const handleLocationUpdate = ({ latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      selectedPlace: prev.selectedPlace
        ? { ...prev.selectedPlace, latitude, longitude }
        : null,
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      key="jam-inline-edit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-6 px-6 py-5"
    >
      {/* ── Cover Photo ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <EditSectionHeader>Cover Photo</EditSectionHeader>
        <ImageUploadField
          label=""
          hint="Optional — a vibe shot or promo image for your jam"
          value={form.coverImage}
          onChange={(v) => setField("coverImage", v)}
          accent={THEME.accent}
        />
      </div>

      <SectionDivider />

      {/* ── Basics ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EditSectionHeader>Basics</EditSectionHeader>

        <JamBasicInfoSection
          form={form}
          errors={errors}
          touched={touched}
          onChange={setField}
          onBlur={handleBlur}
        />

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

      <SectionDivider />

      {/* ── Location ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EditSectionHeader>Location</EditSectionHeader>
        <JamLocationSection
          form={form}
          errors={errors}
          onChange={setField}
          onPlaceSelect={handlePlaceSelect}
          onPlaceClear={handlePlaceClear}
          onLocationUpdate={handleLocationUpdate}
        />
      </div>

      <SectionDivider />

      {/* ── Musical Details ──────────────────────────────────────────────────── */}
      {options ? (
        <div className="space-y-4">
          <EditSectionHeader>Musical Details</EditSectionHeader>
          <JamTaxonomySection
            form={form}
            options={options}
            errors={errors}
            onChange={setField}
            setForm={setForm}
            accent={THEME.accent}
          />
        </div>
      ) : (
        /* Options still loading */
        <div className="flex items-center justify-center py-8">
          <span className="text-sm" style={{ color: "rgba(229,226,225,0.3)" }}>
            Loading options…
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default JamInlineEditForm;
