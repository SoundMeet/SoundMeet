import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MapLocationSearchInput from "../../create-jam/fields/MapLocationSearchInput";
import MapLocationPreview from "../../create-jam/fields/MapLocationPreview";

/**
 * ShowVenueSection — venue search + map preview + extra directions.
 *
 * Props:
 *   form             { locationQuery, selectedPlace, locationGuide }
 *   errors           { selectedPlace? }
 *   onChange         (field, value) => void
 *   onPlaceSelect    (place) => void
 *   onPlaceClear     () => void
 *   onLocationUpdate ({ latitude, longitude }) => void
 */
const ShowVenueSection = ({
  form,
  errors = {},
  onChange,
  onPlaceSelect,
  onPlaceClear,
  onLocationUpdate,
}) => {
  const [mapCenter, setMapCenter] = useState(null);

  const handlePlaceSelect = (place) => {
    setMapCenter({ latitude: place.latitude, longitude: place.longitude });
    onPlaceSelect(place);
  };

  return (
    <div className="space-y-5">
      {/* Venue search */}
      <div>
        <label
          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          Venue
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

      {/* Extra directions */}
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
          placeholder="e.g. Enter through the side door, ask for the venue manager…"
          value={form.locationGuide}
          onChange={(e) => onChange("locationGuide", e.target.value)}
        />
        <p
          className="text-[11px] mt-1 ml-1"
          style={{ color: "rgba(229,226,225,0.22)" }}
        >
          Optional — help attendees find the exact spot.
        </p>
      </div>
    </div>
  );
};

export default ShowVenueSection;
