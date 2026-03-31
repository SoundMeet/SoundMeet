import { useState, useEffect } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import MapPin from "./MapPin";

const MAP_STYLE = `https://api.maptiler.com/maps/019d0d5e-d7ec-7ed1-942f-952f70c3b58b/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

// Centered on Miami proper so all neighborhood pins are visible at zoom 12.
// TODO: replace with real user location from auth profile when available.
const FALLBACK_COORDS = { latitude: 25.775, longitude: -80.200, zoom: 12 };

// Derive pin status from jam data for visual differentiation
const jamToStatus = (jam) => {
  if (jam.isLive) return "now";
  if (jam.isPrivate) return "later"; // yellow — invite-only
  return "soon";
};

/**
 * MapComponent — renders the interactive map with pins from shared jam data.
 *
 * Props:
 *   jams         {object[]} - Full jam list from mockJams (single source of truth)
 *   selectedJamId {string}  - Currently selected jam id (drives pin highlight)
 *   hoveredJamId  {string}  - Currently hovered jam id (drives pin hover state)
 *   onPinSelect  {function} - Called with jamId when a pin is clicked
 *   onPinHover   {function} - Called with jamId when mouse enters a pin
 *   onPinLeave   {function} - Called when mouse leaves a pin
 */
const MapComponent = ({
  jams = [],
  selectedJamId,
  hoveredJamId,
  onPinSelect,
  onPinHover,
  onPinLeave,
}) => {
  const [viewState, setViewState] = useState(FALLBACK_COORDS);

  // Attempt to center on user's real location; fall back silently on denial/error
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setViewState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          zoom: 13,
        });
      },
      () => {}, // permission denied — stay on fallback
      { timeout: 8000 }
    );
  }, []);

  return (
    <Map
      initialViewState={viewState}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onStyleImageMissing={(e) => {
        // Silently provide a transparent placeholder for any missing sprite images
        const map = e.target;
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      }}
    >
      {/* Render one pin per jam — no separate MOCK_PINS needed */}
      {jams.map((jam, i) => (
        <Marker
          key={jam.id}
          latitude={jam.lat}
          longitude={jam.lng}
          anchor="bottom"
        >
          <MapPin
            noteIndex={i % 4}
            status={jamToStatus(jam)}
            isSelected={selectedJamId === jam.id}
            isHovered={hoveredJamId === jam.id}
            onClick={(e) => {
              e.stopPropagation();
              onPinSelect?.(jam.id);
            }}
            onMouseEnter={() => onPinHover?.(jam.id)}
            onMouseLeave={() => onPinLeave?.()}
          />
        </Marker>
      ))}
    </Map>
  );
};

export default MapComponent;
