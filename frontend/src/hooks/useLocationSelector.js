/**
 * hooks/useLocationSelector.js
 *
 * Centralized state management for the unified LocationSelector component.
 *
 * Manages all internal UI state — map context, mode, custom form fields,
 * geocoding enrichment — so that parent forms only need to own the output
 * values (selectedPlace, locationGuide) and can treat the selector as a
 * black box that calls their callbacks when the user makes a choice.
 *
 * Usage:
 *   const selector = useLocationSelector({
 *     selectedPlace,
 *     onPlaceSelect,
 *     onPlaceClear,
 *     allowManual: true,
 *   });
 */

import { useState, useEffect, useRef } from "react";
import { geocodeCustomLocation } from "../services/maptiler/geocodeCustomLocation";

/**
 * @param {object}       opts
 * @param {object|null}  opts.selectedPlace  — parent-controlled selected place
 * @param {function}     opts.onPlaceSelect  — (place) => void — called when user confirms a place
 * @param {function}     opts.onPlaceClear   — () => void — called when user clears the selection
 * @param {boolean}      [opts.allowManual=true] — whether manual entry mode is available
 */
export function useLocationSelector({
  selectedPlace,
  onPlaceSelect,
  onPlaceClear,
  allowManual = true,
}) {
  // ── Map context — fed to the search component for proximity-biased ranking ──

  const [mapCenter, setMapCenter] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  // ── Mode: "search" | "custom" ─────────────────────────────────────────────
  // Initialized from the provided selectedPlace so edit-mode hydration works
  // correctly on first render.

  const [locationMode, setLocationMode] = useState(
    selectedPlace?.isCustom ? "custom" : "search",
  );

  // ── Custom entry fields — persisted across mode switches ──────────────────
  // Initialized from an existing custom place for edit-mode hydration.

  const [customName, setCustomName] = useState(
    selectedPlace?.isCustom ? (selectedPlace.placeName ?? "") : "",
  );
  const [customAddress, setCustomAddress] = useState(
    selectedPlace?.isCustom ? (selectedPlace.address ?? "") : "",
  );

  // ── Geocoding enrichment state ────────────────────────────────────────────

  const [isGeocoding,   setIsGeocoding]   = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(null); // null | "no-pin"

  // ── Refs for async cleanup ────────────────────────────────────────────────

  const geocodeAbortRef = useRef(null);
  // Best-effort device position: used as proximity fallback when no map context exists
  const deviceGeoRef = useRef(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        deviceGeoRef.current = { latitude: coords.latitude, longitude: coords.longitude };
      },
      () => {},
      { timeout: 5000, maximumAge: 300_000 },
    );
    return () => { geocodeAbortRef.current?.abort(); };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isCustomConfirmed = selectedPlace?.isCustom === true;
  const hasRealCoords     = selectedPlace?.latitude != null && selectedPlace?.longitude != null;
  const hasSearchedPlace  = selectedPlace != null && !selectedPlace.isCustom;

  // ── Handlers ──────────────────────────────────────────────────────────────

  /**
   * Called when a place is picked from the search dropdown (or recents).
   * Updates map center so subsequent searches bias toward the new location.
   */
  const handlePlaceSelect = (place) => {
    if (place.latitude != null && place.longitude != null) {
      setMapCenter({ latitude: place.latitude, longitude: place.longitude });
    }
    onPlaceSelect(place);
  };

  /**
   * Called by MapLocationPreview on pan / zoom end.
   * Keeps the search bias in sync with what the user is looking at.
   */
  const handleMapMove = ({ latitude, longitude, bounds }) => {
    setMapCenter({ latitude, longitude });
    if (bounds) setMapBounds(bounds);
  };

  /**
   * Toggle between "search" and "custom" modes.
   * - Re-tapping the active "Enter manually" tab while confirmed → re-opens the form.
   * - Switching modes clears the current selectedPlace so neither mode inherits the other's value.
   * - Custom form fields are intentionally preserved across switches.
   */
  const handleModeSwitch = (newMode) => {
    if (newMode === locationMode) {
      // Re-tap of the active custom-mode tab while a place is confirmed — re-open the form
      if (newMode === "custom" && isCustomConfirmed) {
        onPlaceClear();
        setGeocodeStatus(null);
      }
      return;
    }
    geocodeAbortRef.current?.abort();
    setIsGeocoding(false);
    setGeocodeStatus(null);
    onPlaceClear();
    setLocationMode(newMode);
  };

  /**
   * Confirm a custom location.
   * Attempts forward geocoding to enrich the manually typed entry with real
   * coordinates before saving. The place is ALWAYS saved — coordinates are
   * bonus enrichment, not a requirement.
   */
  const handleCustomConfirm = async () => {
    if (!customName.trim() || isGeocoding) return;

    geocodeAbortRef.current?.abort();
    const ctrl = new AbortController();
    geocodeAbortRef.current = ctrl;

    setIsGeocoding(true);
    setGeocodeStatus(null);

    // Best-known proximity: prefer map-derived center, fall back to device GPS
    const proximity = mapCenter ?? deviceGeoRef.current ?? null;

    let coords = null;
    try {
      coords = await geocodeCustomLocation(
        { name: customName, address: customAddress },
        proximity,
        ctrl.signal,
      );
    } catch {
      // Geocoding is best-effort; proceed regardless
    }

    if (ctrl.signal.aborted) return;

    setIsGeocoding(false);
    setGeocodeStatus(coords ? null : "no-pin");

    if (coords) setMapCenter(coords);

    onPlaceSelect({
      id:           `custom-${Date.now()}`,
      placeName:    customName.trim(),
      address:      customAddress.trim() || null,
      latitude:     coords?.latitude  ?? null,
      longitude:    coords?.longitude ?? null,
      featureType:  "custom",
      isCustom:     true,
      providerName: "manual",
    });
  };

  /** Clear a confirmed custom place and re-open the entry form. */
  const handleCustomClear = () => {
    onPlaceClear();
    setGeocodeStatus(null);
  };

  return {
    // Map context
    mapCenter,
    mapBounds,

    // Mode
    locationMode,
    handleModeSwitch,

    // Custom form fields
    customName,
    setCustomName,
    customAddress,
    setCustomAddress,

    // Geocoding
    isGeocoding,
    geocodeStatus,

    // Handlers
    handlePlaceSelect,
    handleMapMove,
    handleCustomConfirm,
    handleCustomClear,

    // Derived flags
    isCustomConfirmed,
    hasRealCoords,
    hasSearchedPlace,
  };
}
