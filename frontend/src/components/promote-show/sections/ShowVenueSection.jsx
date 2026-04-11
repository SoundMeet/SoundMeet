import LocationSelector, { LOCATION_CONFIGS } from "../../location/LocationSelector";

/**
 * ShowVenueSection — venue search + map preview + extra directions.
 *
 * Wraps the shared LocationSelector with the "show" config (search-only,
 * map pin, always-visible directions).
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
  portalId,
}) => (
  <LocationSelector
    config={LOCATION_CONFIGS.show}
    selectedPlace={form.selectedPlace}
    locationQuery={form.locationQuery}
    locationGuide={form.locationGuide}
    error={errors.selectedPlace}
    onChange={onChange}
    onPlaceSelect={onPlaceSelect}
    onPlaceClear={onPlaceClear}
    onLocationUpdate={onLocationUpdate}
    portalId={portalId}
  />
);

export default ShowVenueSection;
