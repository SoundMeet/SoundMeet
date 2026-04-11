import LocationSelector, { LOCATION_CONFIGS } from "../../location/LocationSelector";
import InfoTooltip from "../../ui/InfoTooltip";

// ─── Visibility options ───────────────────────────────────────────────────────

const PRIVACY_OPTIONS = [
  { id: "public",  label: "Public",  description: "Visible on the map. Anyone can join." },
  { id: "private", label: "Private", description: "Hidden. Invite-only session." },
];

// ─── JamLocationSection ───────────────────────────────────────────────────────
/**
 * Jam-specific location section: wraps the shared LocationSelector (jam config)
 * plus the jam-only Visibility toggle.
 *
 * Props:
 *   form             { locationQuery, selectedPlace, locationGuide, isPrivate }
 *   errors           { selectedPlace? }
 *   onChange         (field, value) => void
 *   onPlaceSelect    (place) => void
 *   onPlaceClear     () => void
 *   onLocationUpdate ({ latitude, longitude }) => void
 */
const JamLocationSection = ({
  form,
  errors,
  onChange,
  onPlaceSelect,
  onPlaceClear,
  onLocationUpdate,
}) => (
  <div className="space-y-5">

    {/* Unified location selector — jam config */}
    <LocationSelector
      config={LOCATION_CONFIGS.jam}
      selectedPlace={form.selectedPlace}
      locationQuery={form.locationQuery}
      locationGuide={form.locationGuide}
      error={errors.selectedPlace}
      onChange={onChange}
      onPlaceSelect={onPlaceSelect}
      onPlaceClear={onPlaceClear}
      onLocationUpdate={onLocationUpdate}
    />

    {/* Visibility / privacy toggle — jam-only */}
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
            form.isPrivate
              ? "Private — hidden from the map. Invite-only."
              : "Public — visible on the map. Anyone can join."
          }
        />
      </div>

      <div className="flex rounded-xl p-1" style={{ background: "#1C1B1B" }}>
        {PRIVACY_OPTIONS.map((opt) => {
          const active = (opt.id === "private") === form.isPrivate;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange("isPrivate", opt.id === "private")}
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
        {form.isPrivate
          ? PRIVACY_OPTIONS[1].description
          : PRIVACY_OPTIONS[0].description}
      </p>
    </div>

  </div>
);

export default JamLocationSection;
