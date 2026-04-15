import { useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import { motion, AnimatePresence } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import UserLocationMarker from "./discover/UserLocationMarker";
import DiscoveryMapMarker from "./discover/DiscoveryMapMarker";
import { getDiscoveryCoordinates } from "../utils/discovery";

const MAP_STYLE = `https://api.maptiler.com/maps/019d0d5e-d7ec-7ed1-942f-952f70c3b58b/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

// Centered on Miami proper so all neighborhood pins are visible at zoom 11.
// On mobile we start one step closer so pins aren't tiny.
const isMobile = () => window.innerWidth < 768;
const FALLBACK_COORDS = { latitude: 25.775, longitude: -80.200, zoom: isMobile() ? 10.5 : 11 };

/**
 * Generates a GeoJSON polygon approximating a circle of radiusMiles
 * centered on (lat, lng). Used to render the radius filter ring on the map.
 */
function radiusCircleGeoJSON(lat, lng, radiusMiles, points = 64) {
  const R = 3958.8; // earth radius in miles
  const latR = (lat * Math.PI) / 180;
  const coords = Array.from({ length: points + 1 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / points;
    const dLat = (radiusMiles / R) * Math.cos(angle);
    const dLng = (radiusMiles / R) * Math.sin(angle) / Math.cos(latR);
    return [lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI];
  });
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] } };
}

/**
 * MapComponent — renders the interactive map with pins from shared jam data.
 *
 * Props:
 *   items             {object[]}  - Discovery items to render on the map
 *   selectedItemId    {string}    - Currently selected discovery id
 *   hoveredItemId     {string}    - Currently hovered discovery id
 *   onItemSelect      {function}  - Called with item id on single click
 *   onItemDoubleClick {function}  - Called with item id on double click (opens modal)
 *   onItemHover       {function}  - Called with item id when mouse enters a marker
 *   onItemLeave       {function}  - Called when mouse leaves a marker
 *   flyToTarget       {object}    - { latitude, longitude, zoom, _ts } to fly/pan,
 *                                   or { zoomDelta, _ts } to zoom relative to current level
 *   userLocation      {object}    - { latitude, longitude } — where to render the user dot
 *   onUserLocation    {function}  - Called with { latitude, longitude } once geolocation resolves
 *   onLocationDenied  {function}  - Called when the user denies geolocation permission
 *   radius            {number}    - Current filter radius in miles — draws a circle on the map
 *   recenterKey       {number}    - Incremented by parent on recenter; triggers pulse on user dot
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
  onLocationDenied,
  radius,
  recenterKey,
}) => {
  const [viewState, setViewState] = useState(FALLBACK_COORDS);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const pendingUserCoords = useRef(null);
  const mapLoaded = useRef(false);

  const flyToUser = (coords) => {
    mapRef.current?.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: isMobile() ? 10.5 : 11,
      duration: 1200,
    });
  };

  // Attempt to center on user's real location; fall back silently on denial/error.
  // GPS and map load race — whichever finishes last triggers the fly.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        onUserLocation?.(coords);
        if (mapLoaded.current) {
          flyToUser(coords);
        } else {
          // Map not ready yet — store and fly once onLoad fires
          pendingUserCoords.current = coords;
        }
      },
      () => onLocationDenied?.(), // permission denied — notify parent
      { timeout: 8000 }
    );
  }, []);

  const handleMapLoad = () => {
    mapLoaded.current = true;
    setMapReady(true);
    if (pendingUserCoords.current) {
      flyToUser(pendingUserCoords.current);
      pendingUserCoords.current = null;
    }
  };

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
        // Always pass padding explicitly — maplibre persists camera padding between
        // flyTo calls, so omitting it here would inherit stale padding (e.g. the
        // large bottom offset set by flyToItem) and push the target off-center.
        padding: flyToTarget.padding ?? { top: 0, bottom: 0, left: 0, right: 0 },
      });
    }
  }, [flyToTarget]);

  const radiusGeoJSON = userLocation && radius
    ? radiusCircleGeoJSON(userLocation.latitude, userLocation.longitude, radius)
    : null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <Map
      ref={mapRef}
      initialViewState={viewState}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onLoad={handleMapLoad}
      onMove={(event) => setViewState(event.viewState)}
      onStyleImageMissing={(e) => {
        // Silently provide a transparent placeholder for any missing sprite images
        const map = e.target;
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      }}
    >
      {/* Radius circle — rendered first so it sits beneath all pins */}
      {radiusGeoJSON && (
        <Source id="radius-circle" type="geojson" data={radiusGeoJSON}>
          <Layer
            id="radius-fill"
            type="fill"
            paint={{ "fill-color": "#DC2E73", "fill-opacity": 0.05 }}
          />
          <Layer
            id="radius-outline"
            type="line"
            paint={{
              "line-color": "#DC2E73",
              "line-width": 1.5,
              "line-opacity": 0.28,
              "line-dasharray": [4, 4],
            }}
          />
        </Source>
      )}

      {/* User location dot — rendered below discovery markers */}
      {userLocation && (
        <Marker
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          anchor="center"
        >
          <UserLocationMarker recenterKey={recenterKey} />
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

    {/* Loading overlay — fades out once map tiles have painted */}
    <AnimatePresence>
      {!mapReady && (
        <motion.div
          key="map-loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#0a0a0a",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </AnimatePresence>
    </div>
  );
};

export default MapComponent;
