import { AnimatePresence, motion } from "framer-motion";
import SearchableTagSection from "../../ui/SearchableTagSection";
import ToggleOptionRow from "../fields/ToggleOptionRow";

// ─── Module-level helper ──────────────────────────────────────────────────────

/**
 * Returns the three SearchableTagSection callbacks for a TagGroupState field.
 * Requires setForm from the parent component.
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

// ─── Primitives ───────────────────────────────────────────────────────────────

const GroupHeading = ({ children }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-[0.14em] pt-1 pb-0.5"
    style={{ color: "rgba(229,226,225,0.2)" }}
  >
    {children}
  </p>
);

const ValidationMessage = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="text-xs mt-1.5"
        style={{ color: "#FB4040" }}
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

// ─── JamTaxonomySection ───────────────────────────────────────────────────────

/**
 * JamTaxonomySection — genres, vibe, jam type, instruments, roles, gear.
 *
 * All option lists are injected via `options` prop — swap mock → backend
 * with zero changes here.
 *
 * Props:
 *   form     CreateJamFormValues   — full form state
 *   options  CreateJamOptionSets   — injectable option lists
 *   errors   { genres?, vibes?, instrumentsNeeded? }
 *   onChange (field, value) => void  — for simple scalar / flag fields
 *   setForm  (updater) => void       — for TagGroupState mutations
 */
const JamTaxonomySection = ({ form, options, errors, onChange, setForm }) => {
  const clearPresetIds = (field) =>
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], presetIds: [] },
    }));

  const toggleAll = (flag, tagField) => {
    const next = !form[flag];
    onChange(flag, next);
    if (next) clearPresetIds(tagField);
  };

  return (
    <div className="space-y-5">
      {/* ── STYLE & LINEUP ──────────────────────────────────────────────────── */}
      <GroupHeading>Style &amp; Lineup</GroupHeading>

      {/* Genres */}
      <div>
        <ToggleOptionRow
          active={form.isOpenToAllGenres}
          label="All Genres Welcome"
          onToggle={() => toggleAll("isOpenToAllGenres", "genres")}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.isOpenToAllGenres ? 0.3 : 1,
            pointerEvents: form.isOpenToAllGenres ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Genres"
            placeholder="Search genres…"
            options={options.genres}
            presetIds={form.genres.presetIds}
            customValues={form.genres.customValues}
            {...makeTagHandlers(setForm, "genres")}
            maxVisible={10}
          />
        </div>
        <ValidationMessage message={errors.genres} />
      </div>

      {/* Vibe */}
      <div>
        <ToggleOptionRow
          active={form.isOpenToAllVibes}
          label="All Vibes Welcome"
          onToggle={() => toggleAll("isOpenToAllVibes", "vibes")}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.isOpenToAllVibes ? 0.3 : 1,
            pointerEvents: form.isOpenToAllVibes ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Vibe"
            placeholder="Search vibes…"
            options={options.vibes}
            presetIds={form.vibes.presetIds}
            customValues={form.vibes.customValues}
            {...makeTagHandlers(setForm, "vibes")}
            maxVisible={8}
          />
        </div>
        <ValidationMessage message={errors.vibes} />
      </div>

      {/* Jam Type */}
      <SearchableTagSection
        title="Jam Type"
        placeholder="Search jam types…"
        options={options.jamTypes}
        presetIds={form.jamTypes.presetIds}
        customValues={form.jamTypes.customValues}
        {...makeTagHandlers(setForm, "jamTypes")}
        maxVisible={6}
      />

      {/* ── PEOPLE ──────────────────────────────────────────────────────────── */}
      <GroupHeading>People</GroupHeading>

      {/* Instruments Needed */}
      <div>
        <ToggleOptionRow
          active={form.isOpenToAllInstruments}
          label="All Instruments Welcome"
          onToggle={() => toggleAll("isOpenToAllInstruments", "instrumentsNeeded")}
        />
        <div
          style={{
            transition: "opacity 0.2s",
            opacity: form.isOpenToAllInstruments ? 0.3 : 1,
            pointerEvents: form.isOpenToAllInstruments ? "none" : "auto",
          }}
        >
          <SearchableTagSection
            title="Instruments Needed"
            placeholder="Search instruments…"
            options={options.instruments}
            presetIds={form.instrumentsNeeded.presetIds}
            customValues={form.instrumentsNeeded.customValues}
            {...makeTagHandlers(setForm, "instrumentsNeeded")}
            maxVisible={10}
          />
        </div>
        <ValidationMessage message={errors.instrumentsNeeded} />
      </div>

      {/* Roles Needed */}
      <SearchableTagSection
        title="Roles Needed"
        placeholder="Search roles…"
        options={options.roles}
        presetIds={form.rolesNeeded.presetIds}
        customValues={form.rolesNeeded.customValues}
        {...makeTagHandlers(setForm, "rolesNeeded")}
        maxVisible={8}
        helperText="More specific than instruments — e.g. Lead Guitarist, Backing Vocalist."
      />

      {/* ── GEAR & SETUP ────────────────────────────────────────────────────── */}
      <GroupHeading>Gear &amp; Setup</GroupHeading>

      <SearchableTagSection
        title="Available at Jam"
        placeholder="Search equipment…"
        options={options.equipmentAvailable}
        presetIds={form.equipmentAvailable.presetIds}
        customValues={form.equipmentAvailable.customValues}
        {...makeTagHandlers(setForm, "equipmentAvailable")}
        maxVisible={8}
        helperText="Gear already at the venue that attendees can use."
      />

      <SearchableTagSection
        title="Need People to Bring"
        placeholder="Search gear to bring…"
        options={options.equipmentNeeded}
        presetIds={form.equipmentNeeded.presetIds}
        customValues={form.equipmentNeeded.customValues}
        {...makeTagHandlers(setForm, "equipmentNeeded")}
        maxVisible={8}
        helperText="Gear attendees should bring for the jam to work."
      />

      {/* ── SESSION DETAILS ──────────────────────────────────────────────────── */}
      <GroupHeading>Session Details</GroupHeading>

      {/* Skill Level — single select, few options, no need for search */}
      <div>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2"
          style={{ color: "rgba(229,226,225,0.35)" }}
        >
          Skill Level
        </p>
        <div className="flex flex-wrap gap-1.5">
          {options.skillLevels.map((opt) => {
            const active = form.skillLevel === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                onClick={() => onChange("skillLevel", active ? null : opt.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.1 }}
                className="text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 select-none"
                style={{
                  borderRadius: "9999px",
                  background: active ? "rgba(220,46,115,0.18)" : "#2A2A2A",
                  color: active ? "#DC2E73" : "rgba(229,226,225,0.48)",
                  boxShadow: active ? "0 0 0 1px rgba(220,46,115,0.32)" : "none",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JamTaxonomySection;
