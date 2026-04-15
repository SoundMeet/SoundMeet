/**
 * ShowInlineEditForm — pure presentational edit form rendered inside the show
 * detail modal when the creator enters edit mode.
 *
 * All state is owned by EventDetailModal and passed as props.
 * Mirrors JamInlineEditForm's structure and interaction model — same shell,
 * same section rhythm, same footer — with Show-specific field sections.
 *
 * Reuses field components from the promote-show flow:
 *   ShowBasicInfoSection, ShowLineupSection
 * Shared location UI: LocationSelector (show config — yellow accent)
 * Shared UI: SearchableTagPicker, ImageUploadField.
 */

import { motion } from "framer-motion";
import ShowBasicInfoSection from "../promote-show/sections/ShowBasicInfoSection";
import ShowLineupSection from "../promote-show/sections/ShowLineupSection";
import LocationSelector, { LOCATION_CONFIGS } from "../location/LocationSelector";
import SearchableTagPicker from "../ui/SearchableTagPicker";
import ImageUploadField from "../ui/ImageUploadField";
import { getFormTheme } from "../../utils/discovery";

const THEME = getFormTheme("promote_show");

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

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, hint, error, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs" style={{ color: "#FB4040" }}>{error}</p>
    )}
    {!error && hint && (
      <p className="text-xs" style={{ color: "rgba(229,226,225,0.28)" }}>{hint}</p>
    )}
  </div>
);

// ─── ShowInlineEditForm ───────────────────────────────────────────────────────

/**
 * Props:
 *   form        — full show edit form state (owned by EventDetailModal)
 *   setForm     — (updater | nextForm) => void
 *   errors      — field error map
 *   setErrors   — (updater | nextErrors) => void
 *   touched     — field touched map
 *   setTouched  — (updater | nextTouched) => void
 *   options     — { genres[] } from useFormOptions
 */
const ShowInlineEditForm = ({
  form,
  setForm,
  errors,
  setErrors,
  touched,
  setTouched,
  options,
}) => {
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  // ── Genre tag handlers (selectedIds shape) ────────────────────────────────

  const genreTagHandlers = {
    onTogglePreset: (id) =>
      setForm((prev) => {
        const g = prev.genres;
        const ids = g.selectedIds.includes(id)
          ? g.selectedIds.filter((i) => i !== id)
          : [...g.selectedIds, id];
        return { ...prev, genres: { ...g, selectedIds: ids } };
      }),
    onAddCustom: (val) =>
      setForm((prev) => ({
        ...prev,
        genres: { ...prev.genres, customValues: [...prev.genres.customValues, val] },
      })),
    onRemoveCustom: (val) =>
      setForm((prev) => ({
        ...prev,
        genres: {
          ...prev.genres,
          customValues: prev.genres.customValues.filter((v) => v !== val),
        },
      })),
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      key="show-inline-edit"
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
          hint="Optional — show poster or promo image"
          value={form.coverImage}
          onChange={(v) => setField("coverImage", v)}
          accent={THEME.accent}
        />
      </div>

      <SectionDivider />

      {/* ── Basics ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EditSectionHeader>Basics</EditSectionHeader>

        <ShowBasicInfoSection
          form={form}
          errors={errors}
          onChange={setField}
        />

        <Field label="Description">
          <textarea
            rows={3}
            className="jam-input resize-none"
            style={{ borderRadius: "0.75rem" }}
            placeholder="Tell people what to expect at the show…"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
      </div>

      <SectionDivider />

      {/* ── Venue ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EditSectionHeader>Venue</EditSectionHeader>
        <LocationSelector
          config={LOCATION_CONFIGS.show}
          selectedPlace={form.selectedPlace}
          locationQuery={form.locationQuery}
          locationGuide={form.locationGuide}
          error={errors.selectedPlace}
          onChange={setField}
          onPlaceSelect={handlePlaceSelect}
          onPlaceClear={handlePlaceClear}
          onLocationUpdate={handleLocationUpdate}
          portalId="location-dropdown-portal"
        />
      </div>

      <SectionDivider />

      {/* ── Show Details ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <EditSectionHeader>Show Details</EditSectionHeader>

        {/* Lineup */}
        <ShowLineupSection
          lineup={form.lineup}
          onChange={(v) => setField("lineup", v)}
          accent={THEME.accent}
          gradientFrom={THEME.gradientFrom}
          gradientTo={THEME.gradientTo}
        />

        {/* Genres */}
        {options ? (
          <SearchableTagPicker
            title="Genres"
            placeholder="Search genres…"
            options={options.genres}
            selectedIds={form.genres.selectedIds}
            customValues={form.genres.customValues}
            accent={THEME.accent}
            {...genreTagHandlers}
          />
        ) : (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm" style={{ color: "rgba(229,226,225,0.3)" }}>
              Loading options…
            </span>
          </div>
        )}

        {/* Ticket price + max capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Ticket Price" hint="Leave blank for free">
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: "rgba(229,226,225,0.3)" }}
              >
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                className="jam-input pl-7"
                placeholder="0.00"
                value={form.ticketPrice}
                onChange={(e) => setField("ticketPrice", e.target.value)}
              />
            </div>
          </Field>

          <Field label="Max Capacity" hint="Blank = unlimited">
            <input
              type="number"
              min={1}
              className="jam-input"
              placeholder="∞"
              value={form.maxCapacity}
              onChange={(e) => setField("maxCapacity", e.target.value)}
            />
          </Field>
        </div>

        {/* Ticket link */}
        <Field label="Ticket Link" hint="Optional — Eventbrite, RA, Dice, etc.">
          <input
            type="url"
            className="jam-input"
            placeholder="https://…"
            value={form.ticketLink}
            onChange={(e) => setField("ticketLink", e.target.value)}
          />
        </Field>
      </div>
    </motion.div>
  );
};

export default ShowInlineEditForm;
