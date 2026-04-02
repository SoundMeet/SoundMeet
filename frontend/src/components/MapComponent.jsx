import { useState, useEffect, useRef } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import UserLocationMarker from "./discover/UserLocationMarker";
import DiscoveryMapMarker from "./discover/DiscoveryMapMarker";
import { getDiscoveryCoordinates } from "../utils/discovery";

const MAP_STYLE = `https://api.maptiler.com/maps/019d0d5e-d7ec-7ed1-942f-952f70c3b58b/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

// Centered on Miami proper so all neighborhood pins are visible at zoom 12.
const FALLBACK_COORDS = { latitude: 25.775, longitude: -80.200, zoom: 12 };

/**
 * MapComponent — renders the interactive map with pins from shared jam data.
 *
 * Props:
 *   items          {object[]}  - Discovery items to render on the map
 *   selectedItemId {string}    - Currently selected discovery id
 *   hoveredItemId  {string}    - Currently hovered discovery id
 *   onItemSelect      {function}  - Called with item id on single click
 *   onItemDoubleClick {function}  - Called with item id on double click (opens modal)
 *   onItemHover    {function}  - Called with item id when mouse enters a marker
 *   onItemLeave    {function}  - Called when mouse leaves a marker
 *   flyToTarget    {object}    - { latitude, longitude, zoom, _ts } to fly/pan,
 *                                or { zoomDelta, _ts } to zoom relative to current level
 *   userLocation   {object}    - { latitude, longitude } — where to render the user dot
 *   onUserLocation {function}  - Called with { latitude, longitude } once geolocation resolves
 */
const MapComponent = ({
  items = [],
  selectedItemId,
  hoveredItemId,
  onItemSelect,
  onItemDoubleClick,
  onItemHover,
  onItemLeave,
  flyToTarget,
  userLocation,
  onUserLocation,
}) => {
  const [viewState, setViewState] = useState(FALLBACK_COORDS);
  const mapRef = useRef(null);

  // Attempt to center on user's real location; fall back silently on denial/error
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setViewState({ ...coords, zoom: 13 });
        onUserLocation?.(coords);
      },
      () => {}, // permission denied — stay on fallback
      { timeout: 8000 }
    );
  }, []);

  // Handle flyToTarget changes — supports pan+zoom, relative zoom delta, or fitBounds
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    const map = mapRef.current.getMap();

    if (flyToTarget.zoomDelta != null) {
      // Zoom in/out relative to current level
      const currentZoom = map.getZoom();
      mapRef.current.flyTo({
        zoom: currentZoom + flyToTarget.zoomDelta,
        duration: 350,
      });
    } else if (flyToTarget.bounds) {
      // Fit viewport to a bounding box — used for radius-based reframing
      map.fitBounds(flyToTarget.bounds, {
        padding: flyToTarget.padding ?? 60,
        duration: 900,
        essential: true,
      });
    } else {
      mapRef.current.flyTo({
        center: [flyToTarget.longitude, flyToTarget.latitude],
        zoom: flyToTarget.zoom ?? 14,
        duration: 1000,
      });
    }
  }, [flyToTarget]);

  return (
    <Map
      ref={mapRef}
      initialViewState={viewState}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onMove={(event) => setViewState(event.viewState)}
      onStyleImageMissing={(e) => {
        // Silently provide a transparent placeholder for any missing sprite images
        const map = e.target;
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      }}
    >
      {/* User location dot — rendered below discovery markers */}
      {userLocation && (
        <Marker
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          anchor="center"
        >
          <UserLocationMarker />
        </Marker>
      )}

      {items.map((item) => {
        const coords = getDiscoveryCoordinates(item);
        if (!coords) return null;

        return (
          <Marker
            key={item.id}
            latitude={coords.latitude}
            longitude={coords.longitude}
            anchor={item.locationVisibility === "approximate" ? "center" : "bottom"}
          >
            <DiscoveryMapMarker
              item={item}
              zoom={viewState.zoom}
              isSelected={selectedItemId === item.id}
              isHovered={hoveredItemId === item.id}
              onClick={(event) => {
                event.stopPropagation();
                onItemSelect?.(item.id);
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                onItemDoubleClick?.(item.id);
              }}
              onMouseEnter={() => onItemHover?.(item.id)}
              onMouseLeave={() => onItemLeave?.()}
            />
          </Marker>
        );
      })}
    </Map>
  );
};

export default MapComponent;
