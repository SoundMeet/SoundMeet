/**
 * components/location/LocationSelector.jsx
 *
 * Unified location selection component used across all SoundMeet forms that
 * involve place, venue, or area selection.
 *
 * Supported form types (via the `config` prop):
 *   jam           — dual-mode (search + manual), map pin, animated directions
 *   show          — search only, map pin, always-visible directions
 *   join_band     — dual-mode, area-type manual entry, no map, no directions
 *   find_bandmate — dual-mode, area-type manual entry, no map, no directions
 *
 * The component is deliberately controlled: the parent form owns selectedPlace,
 * locationQuery, and locationGuide. All internal UI state (map context, mode,
 * custom form fields, geocoding) is encapsulated in useLocationSelector.
 *
 * Props:
 *   config            LocationConfig — see LOCATION_CONFIGS below for examples
 *   selectedPlace     object|null    — parent-owned confirmed place
 *   locationQuery     string         — parent-owned search input text
 *   locationGuide     string         — parent-owned extra directions text
 *   error             string|undefined
 *   onChange          (field, value) => void — field is "locationQuery" or "locationGuide"
 *   onPlaceSelect     (place) => void
 *   onPlaceClear      () => void
 *   onLocationUpdate  ({ latitude, longitude }) => void — map marker drag refinement
 */

import { AnimatePresence, motion } from "framer-motion";
import { useLocationSelector } from "../../hooks/useLocationSelector";
import MapLocationSearchInput from "../create-jam/fields/MapLocationSearchInput";
import MapLocationPreview from "../create-jam/fields/MapLocationPreview";

// ─── Config presets ───────────────────────────────────────────────────────────

/**
 * Ready-to-use config objects for each supported form type.
 * Pass one of these (or a custom object) as the `config` prop.
 */
export const LOCATION_CONFIGS = {
  jam: {
    label:                   "Location",
    hint:                    "Choose a searchable place or add your own.",
    required:                true,
    allowManual:             true,
    showMap:                 true,
    showDirections:          true,
    directionsAlwaysVisible: false,
    directionsLabel:         "Extra Directions",
    directionsPlaceholder:   '"Use the side gate" or "Text when you arrive"',
    directionsHint:          "Optional — help attendees find the exact spot.",
    searchPlaceholder:       "Search venues, parks, addresses…",
    manualVariant:           "full",
    manualHelperText:        "Add a place name and any details attendees need to find it.",
    manualNamePlaceholder:   "e.g. Tio's Backyard, Practice Room B, Under the bridge",
    manualAddressPlaceholder:"Near FIU MMC or 107th Ave & 16th St",
    gradientFrom:            "#DC2E73",
    gradientTo:              "#FB4040",
  },
  show: {
    label:                   "Venue",
    hint:                    "Choose a searchable venue or add your own.",
    required:                true,
    allowManual:             true,
    showMap:                 true,
    showDirections:          true,
    directionsAlwaysVisible: false,
    directionsLabel:         "Extra Directions",
    directionsPlaceholder:   "e.g. Enter through the side door, ask for the venue manager…",
    directionsHint:          "Optional — help attendees find the exact spot.",
    searchPlaceholder:       "Search venues, parks, addresses…",
    manualVariant:           "full",
    manualHelperText:        "Add the venue name and any location details attendees will need.",
    manualNamePlaceholder:   "e.g. The Fillmore, Bayfront Park Amphitheater",
    manualAddressPlaceholder:"e.g. 1700 Washington Ave, Miami Beach",
    gradientFrom:            "#F7C10D",
    gradientTo:              "#F59E0B",
  },
  join_band: {
    label:                   "City / Area",
    hint:                    "Used for local matching — musicians nearby will discover you.",
    required:                true,
    allowManual:             true,
    showMap:                 false,
    showDirections:          false,
    directionsAlwaysVisible: false,
    directionsLabel:         "",
    directionsPlaceholder:   "",
    directionsHint:          "",
    searchPlaceholder:       "Search cities, neighborhoods, areas…",
    manualVariant:           "area",
    manualHelperText:        "Type your city or area.",
    manualNamePlaceholder:   "e.g. Miami, FL",
    manualAddressPlaceholder: "",
    gradientFrom:            "#8B5CF6",
    gradientTo:              "#7C3AED",
  },
  find_bandmate: {
    label:                   "City / Area",
    hint:                    "Used to help nearby musicians discover this opportunity.",
    required:                true,
    allowManual:             true,
    showMap:                 false,
    showDirections:          false,
    directionsAlwaysVisible: false,
    directionsLabel:         "",
    directionsPlaceholder:   "",
    directionsHint:          "",
    searchPlaceholder:       "Search cities, neighborhoods, areas…",
    manualVariant:           "area",
    manualHelperText:        "Type the city or area for this listing.",
    manualNamePlaceholder:   "e.g. Miami, FL",
    manualAddressPlaceholder: "",
    gradientFrom:            "#14B8A6",
    gradientTo:              "#0D9488",
  },
};

const MODE_OPTIONS = [
  { id: "search", label: "Search place"   },
  { id: "custom", label: "Enter manually" },
];

// ─── LocationSelector ─────────────────────────────────────────────────────────

const LocationSelector = ({
  config = LOCATION_CONFIGS.jam,
  selectedPlace,
  locationQuery = "",
  locationGuide = "",
  error,
  onChange,
  onPlaceSelect,
  onPlaceClear,
  onLocationUpdate,
  portalId = "location-dropdown-portal",
}) => {
  const {
    label                   = "Location",
    hint,
    required                = false,
    allowManual             = true,
    showMap                 = true,
    showDirections          = true,
    directionsAlwaysVisible = false,
    directionsLabel         = "Extra Directions",
    directionsPlaceholder   = '"Use the side gate" or "Text when you arrive"',
    directionsHint          = "Optional — help attendees find the exact spot.",
    searchPlaceholder       = "Search venues, parks, addresses…",
    manualVariant           = "full",
    manualHelperText        = "",
    manualNamePlaceholder   = "",
    manualAddressPlaceholder= "",
    gradientFrom            = "#DC2E73",
    gradientTo              = "#FB4040",
  } = config;

  const {
    mapCenter, mapBounds,
    locationMode, handleModeSwitch,
    customName, setCustomName,
    customAddress, setCustomAddress,
    isGeocoding, geocodeStatus,
    handlePlaceSelect, handleMapMove,
    handleCustomConfirm, handleCustomClear,
    isCustomConfirmed, hasRealCoords, hasSearchedPlace,
  } = useLocationSelector({ selectedPlace, onPlaceSelect, onPlaceClear, allowManual });

  // Directions are shown after a place is confirmed in animated mode,
  // or always in show-venue mode.
  const showDirectionsBlock = showDirections && (
    directionsAlwaysVisible
      ? true
      : (hasSearchedPlace || isCustomConfirmed)
  );

  return (
    <div className="space-y-5">

      {/* ── Label + hint ──────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <label
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "rgba(229,226,225,0.4)" }}
          >
            {label}
            {required && <span style={{ color: gradientFrom }} aria-hidden>*</span>}
          </label>
          {hint && (
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(229,226,225,0.2)" }}>
              {hint}
            </p>
          )}
        </div>

        {/* ── Mode toggle — only when allowManual ─────────────────────────── */}
        {allowManual && (
          <div
            className="flex rounded-xl p-1 mb-4"
            style={{ background: "#1C1B1B" }}
          >
            {MODE_OPTIONS.map((opt) => {
              const active = locationMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleModeSwitch(opt.id)}
                  className="relative flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                      : "transparent",
                    color: active ? "#ffffff" : "rgba(229,226,225,0.3)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Active mode content ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Search mode */}
          {locationMode === "search" && (
            <motion.div
              key="search-mode"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <MapLocationSearchInput
                query={locationQuery}
                selectedPlace={selectedPlace}
                mapCenter={mapCenter}
                mapBounds={mapBounds}
                onQueryChange={(q) => onChange("locationQuery", q)}
                onSelect={handlePlaceSelect}
                onClear={onPlaceClear}
                onCustomLocation={allowManual ? () => handleModeSwitch("custom") : undefined}
                error={error}
                portalId={portalId}
                searchPlaceholder={searchPlaceholder}
              />
            </motion.div>
          )}

          {/* Manual / custom mode */}
          {locationMode === "custom" && (
            <motion.div
              key="custom-mode"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {manualVariant === "area" ? (
                <AreaManualForm
                  name={customName}
                  confirmedPlace={isCustomConfirmed ? selectedPlace : null}
                  isGeocoding={isGeocoding}
                  geocodeStatus={geocodeStatus}
                  onNameChange={setCustomName}
                  onConfirm={handleCustomConfirm}
                  onClear={handleCustomClear}
                  error={error}
                  helperText={manualHelperText}
                  namePlaceholder={manualNamePlaceholder}
                  gradientFrom={gradientFrom}
                  gradientTo={gradientTo}
                />
              ) : (
                <FullCustomForm
                  name={customName}
                  address={customAddress}
                  // In full form, directions inside the custom block are shown only
                  // when the outer directions field is NOT always-visible (jam mode).
                  locationGuide={!directionsAlwaysVisible ? locationGuide : ""}
                  confirmedPlace={isCustomConfirmed ? selectedPlace : null}
                  isGeocoding={isGeocoding}
                  geocodeStatus={geocodeStatus}
                  onNameChange={setCustomName}
                  onAddressChange={setCustomAddress}
                  onLocationGuideChange={
                    !directionsAlwaysVisible
                      ? (v) => onChange("locationGuide", v)
                      : undefined
                  }
                  onConfirm={handleCustomConfirm}
                  onClear={handleCustomClear}
                  error={error}
                  helperText={manualHelperText}
                  namePlaceholder={manualNamePlaceholder}
                  addressPlaceholder={manualAddressPlaceholder}
                  directionsLabel={directionsLabel}
                  directionsPlaceholder={directionsPlaceholder}
                  gradientFrom={gradientFrom}
                  gradientTo={gradientTo}
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Map preview ───────────────────────────────────────────────────── */}
      {showMap && (
        <AnimatePresence>
          {hasRealCoords && (
            <MapLocationPreview
              selectedPlace={selectedPlace}
              onLocationUpdate={onLocationUpdate}
              onMapMove={handleMapMove}
            />
          )}
        </AnimatePresence>
      )}

      {/* ── Extra directions ──────────────────────────────────────────────── */}
      {showDirections && (
        directionsAlwaysVisible ? (
          <DirectionsField
            label={directionsLabel}
            placeholder={directionsPlaceholder}
            hint={directionsHint}
            value={locationGuide}
            onChange={(v) => onChange("locationGuide", v)}
          />
        ) : (
          <AnimatePresence>
            {showDirectionsBlock && (
              <motion.div
                key="extra-directions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{    opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <DirectionsField
                  label={directionsLabel}
                  placeholder={directionsPlaceholder}
                  hint={directionsHint}
                  value={locationGuide}
                  onChange={(v) => onChange("locationGuide", v)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )
      )}

    </div>
  );
};

export default LocationSelector;

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * DirectionsField — Extra directions textarea, shared across modes.
 */
const DirectionsField = ({ label, placeholder, hint, value, onChange }) => (
  <div>
    <label
      className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5"
      style={{ color: "rgba(229,226,225,0.4)" }}
    >
      {label}
    </label>
    <textarea
      rows={2}
      className="jam-input resize-none"
      style={{ borderRadius: "0.75rem" }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {hint && (
      <p className="text-[11px] mt-1 ml-1" style={{ color: "rgba(229,226,225,0.22)" }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── SelectedLocationChip ─────────────────────────────────────────────────────
/**
 * Shared confirmed-location chip used in both manual form variants.
 * Shows the place name, optional address, optional geocoding notice, and a clear button.
 */
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const SelectedLocationChip = ({ place, geocodeStatus, onClear, error, badge, gradientFrom = "#DC2E73" }) => (
  <div>
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{
        background: hexToRgba(gradientFrom, 0.08),
        boxShadow:  `0 0 0 1px ${hexToRgba(gradientFrom, 0.22)}`,
      }}
    >
      <span className="flex-shrink-0 mt-0.5 text-base" style={{ color: gradientFrom }}>
        📍
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate leading-snug">
            {place.placeName}
          </p>
          {badge && (
            <span
              style={{
                fontSize:      9,
                color:         hexToRgba(gradientFrom, 0.6),
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight:    600,
                flexShrink:    0,
                paddingTop:    1,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {place.address && (
          <p
            className="text-[11px] mt-0.5 leading-snug"
            style={{ color: "rgba(229,226,225,0.4)" }}
          >
            {place.address}
          </p>
        )}
        {geocodeStatus === "no-pin" && (
          <p
            className="text-[10px] mt-1 leading-snug"
            style={{ color: "rgba(229,226,225,0.28)" }}
          >
            No exact pin found — location details will still be shown.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        aria-label="Edit location"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-150"
        style={{ color: "rgba(229,226,225,0.4)", fontSize: 11 }}
      >
        ✕
      </button>
    </motion.div>

    {error && (
      <p className="text-xs mt-1.5 ml-1" style={{ color: "#FB4040" }}>
        {error}
      </p>
    )}
  </div>
);

// ─── FullCustomForm ───────────────────────────────────────────────────────────
/**
 * Manual entry form for jam/show-style forms (manualVariant: "full").
 * Fields: place name (required), area/address (optional), extra directions (optional).
 */
const FullCustomForm = ({
  name,
  address,
  locationGuide,
  confirmedPlace,
  isGeocoding,
  geocodeStatus,
  onNameChange,
  onAddressChange,
  onLocationGuideChange,
  onConfirm,
  onClear,
  error,
  helperText,
  namePlaceholder,
  addressPlaceholder,
  directionsLabel,
  directionsPlaceholder,
  gradientFrom = "#DC2E73",
  gradientTo   = "#FB4040",
}) => {
  // Confirmed chip
  if (confirmedPlace) {
    return (
      <SelectedLocationChip
        place={confirmedPlace}
        geocodeStatus={geocodeStatus}
        onClear={onClear}
        error={error}
        badge="Custom"
        gradientFrom={gradientFrom}
      />
    );
  }

  // Entry form
  const canConfirm = name.trim().length > 0 && !isGeocoding;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="rounded-xl p-4 space-y-3.5"
        style={{
          background: "rgba(255,255,255,0.03)",
          boxShadow:  "0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {helperText && (
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(229,226,225,0.28)" }}>
            {helperText}
          </p>
        )}

        {/* Place name */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.09em] mb-1.5"
            style={{ color: "rgba(229,226,225,0.38)" }}
          >
            Place name
            <span style={{ color: "#DC2E73", marginLeft: 3 }}>*</span>
          </label>
          <input
            type="text"
            className="jam-input"
            placeholder={namePlaceholder || "e.g. Tio's Backyard, Practice Room B"}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Area / address */}
        <div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <label
              className="text-[10px] font-medium uppercase tracking-[0.09em]"
              style={{ color: "rgba(229,226,225,0.38)" }}
            >
              Area / address
            </label>
            <span className="text-[10px]" style={{ color: "rgba(229,226,225,0.2)" }}>
              optional
            </span>
          </div>
          <input
            type="text"
            className="jam-input"
            placeholder={addressPlaceholder || "Near FIU MMC or 107th Ave & 16th St"}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Extra directions — only in jam-style mode (not always-visible mode) */}
        {onLocationGuideChange && (
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <label
                className="text-[10px] font-medium uppercase tracking-[0.09em]"
                style={{ color: "rgba(229,226,225,0.38)" }}
              >
                {directionsLabel || "Extra directions"}
              </label>
              <span className="text-[10px]" style={{ color: "rgba(229,226,225,0.2)" }}>
                optional
              </span>
            </div>
            <textarea
              rows={2}
              className="jam-input resize-none"
              style={{ borderRadius: "0.75rem" }}
              placeholder={directionsPlaceholder || '"Use the side gate"'}
              value={locationGuide}
              onChange={(e) => onLocationGuideChange(e.target.value)}
            />
          </div>
        )}

        {/* Set location button */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: canConfirm
              ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
              : "rgba(255,255,255,0.06)",
            color:  canConfirm ? "#fff" : "rgba(229,226,225,0.2)",
            cursor: canConfirm ? "pointer" : "not-allowed",
          }}
        >
          {isGeocoding ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              Locating…
            </>
          ) : "Set location"}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-2 ml-1" style={{ color: "#FB4040" }}>
          {error}
        </p>
      )}
    </motion.div>
  );
};

// ─── AreaManualForm ───────────────────────────────────────────────────────────
/**
 * Lightweight manual entry for city/area-type forms (manualVariant: "area").
 * Used by Join Band and Find a Bandmate — no address or directions fields,
 * just a single text input for the area name.
 */
const AreaManualForm = ({
  name,
  confirmedPlace,
  isGeocoding,
  geocodeStatus,
  onNameChange,
  onConfirm,
  onClear,
  error,
  helperText,
  namePlaceholder,
  gradientFrom = "#DC2E73",
  gradientTo   = "#FB4040",
}) => {
  // Confirmed chip
  if (confirmedPlace) {
    return (
      <SelectedLocationChip
        place={confirmedPlace}
        geocodeStatus={geocodeStatus}
        onClear={onClear}
        error={error}
        badge={confirmedPlace.isCustom ? "Custom" : null}
        gradientFrom={gradientFrom}
      />
    );
  }

  const canConfirm = name.trim().length > 0 && !isGeocoding;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          boxShadow:  "0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {helperText && (
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(229,226,225,0.28)" }}>
            {helperText}
          </p>
        )}

        <input
          type="text"
          className="jam-input"
          placeholder={namePlaceholder || "e.g. Miami, FL"}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: canConfirm
              ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
              : "rgba(255,255,255,0.06)",
            color:  canConfirm ? "#fff" : "rgba(229,226,225,0.2)",
            cursor: canConfirm ? "pointer" : "not-allowed",
          }}
        >
          {isGeocoding ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
              Locating…
            </>
          ) : "Set location"}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-2 ml-1" style={{ color: "#FB4040" }}>
          {error}
        </p>
      )}
    </motion.div>
  );
};
