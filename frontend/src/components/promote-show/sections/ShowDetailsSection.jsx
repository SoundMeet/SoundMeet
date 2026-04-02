import SearchableTagPicker from "../../ui/SearchableTagPicker";
import PrivacyToggle from "../../ui/PrivacyToggle";
import ImageUploadField from "../../ui/ImageUploadField";
import ShowLineupSection from "./ShowLineupSection";

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
      </label>
    )}
    {children}
    {hint && (
      <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.22)" }}>{hint}</p>
    )}
  </div>
);

// ─── ShowDetailsSection ───────────────────────────────────────────────────────

/**
 * ShowDetailsSection — poster, lineup, genres, ticketing, description, capacity, privacy.
 *
 * Props:
 *   form         { coverImage, lineup, genres, ticketPrice, ticketLink,
 *                  description, maxCapacity, isPrivate }
 *   options      { genres[] }
 *   onChange     (field, value) => void
 *   tagHandlers  { genres: { onTogglePreset, onAddCustom, onRemoveCustom } }
 *   accent       string  — hex from FORM_THEMES
 *   gradientFrom string  — hex
 *   gradientTo   string  — hex
 */
const ShowDetailsSection = ({
  form,
  options,
  onChange,
  tagHandlers,
  accent       = "#F7C10D",
  gradientFrom = "#F7C10D",
  gradientTo   = "#F59E0B",
}) => (
  <div className="space-y-5">
    {/* Show poster */}
    <ImageUploadField
      label="Show Poster"
      hint="Optional — shown prominently on your show listing"
      value={form.coverImage}
      onChange={(v) => onChange("coverImage", v)}
      accent={accent}
    />

    {/* Lineup */}
    <ShowLineupSection
      lineup={form.lineup}
      onChange={(v) => onChange("lineup", v)}
      accent={accent}
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
    />

    {/* Genres */}
    <SearchableTagPicker
      title="Genres"
      placeholder="Search genres…"
      options={options.genres}
      selectedIds={form.genres.selectedIds}
      customValues={form.genres.customValues}
      accent={accent}
      {...tagHandlers.genres}
    />

    {/* Ticket price + capacity */}
    <div className="grid grid-cols-2 gap-3">
      <Field label="Ticket Price" hint="Leave blank or 0 for free">
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
            onChange={(e) => onChange("ticketPrice", e.target.value)}
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
          onChange={(e) => onChange("maxCapacity", e.target.value)}
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
        onChange={(e) => onChange("ticketLink", e.target.value)}
      />
    </Field>

    {/* Description */}
    <Field label="Description">
      <textarea
        rows={3}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="Tell people what to expect at the show…"
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
      />
    </Field>

    {/* Privacy */}
    <div
      className="space-y-2 pt-2"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Visibility
      </label>
      <PrivacyToggle
        value={form.isPrivate}
        onChange={(v) => onChange("isPrivate", v)}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
      />
    </div>
  </div>
);

export default ShowDetailsSection;
