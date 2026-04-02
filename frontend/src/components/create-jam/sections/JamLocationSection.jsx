import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MapLocationSearchInput from "../fields/MapLocationSearchInput";
import MapLocationPreview from "../fields/MapLocationPreview";
import InfoTooltip from "../../ui/InfoTooltip";
import { privacyOptions } from "../../../data/jamFormOptions";

const SectionLabel = ({ children }) => (
  <p
    className="text-[11px] font-medium uppercase tracking-[0.1em] mb-2.5"
    style={{ color: "rgba(229,226,225,0.35)" }}
  >
    {children}
  </p>
);

/**
 * JamLocationSection — location search + map preview + extra directions + privacy.
 *
 * Owns `mapCenter` — the best-known geographic context for biasing searches.
 * It is initialized to null and updated from two sources:
 *   1. When the user selects a place → set to that place's coordinates.
 *   2. When the user pans the preview map → updated to the new map center.
 * This means a second search after clearing a selection stays biased to the
 * same area, even without geolocation permission.
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
}) => {
  // Geographic context for search biasing — persists across clear/re-search cycles
  const [mapCenter, setMapCenter] = useState(null);

  const handlePlaceSelect = (place) => {
    setMapCenter({ latitude: place.latitude, longitude: place.longitude });
    onPlaceSelect(place);
  };

  return (
  <div className="space-y-5">
    {/* Location search */}
    <div>
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Location
        <span style={{ color: "#DC2E73" }} aria-hidden>*</span>
      </label>

      <MapLocationSearchInput
        query={form.locationQuery}
        selectedPlace={form.selectedPlace}
        mapCenter={mapCenter}
        onQueryChange={(q) => onChange("locationQuery", q)}
        onSelect={handlePlaceSelect}
        onClear={onPlaceClear}
        error={errors.selectedPlace}
      />
    </div>

    {/* Map preview — animates in after a place is selected */}
    <AnimatePresence>
      {form.selectedPlace && (
        <MapLocationPreview
          selectedPlace={form.selectedPlace}
          onLocationUpdate={onLocationUpdate}
          onMapMove={setMapCenter}
        />
      )}
    </AnimatePresence>

    {/* Extra Directions — optional wayfinding note from the creator */}
    <div>
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Extra Directions
      </label>
      <textarea
        rows={2}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="e.g. Go through the red door, meet on the second floor…"
        value={form.locationGuide}
        onChange={(e) => onChange("locationGuide", e.target.value)}
      />
      <p
        className="text-[11px] mt-1 ml-1"
        style={{ color: "rgba(229,226,225,0.22)" }}
      >
        Optional — help attendees find the exact spot after arriving.
      </p>
    </div>

    {/* Privacy toggle */}
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
        {privacyOptions.map((opt) => {
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
          ? privacyOptions[1].description
          : privacyOptions[0].description}
      </p>
    </div>
  </div>
  );
};

export default JamLocationSection;
