import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = `https://api.maptiler.com/maps/019d0d5e-d7ec-7ed1-942f-952f70c3b58b/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

/**
 * MapLocationPreview — compact map showing the selected jam location.
 *
 * Features:
 *   - Animates in when a place is first selected
 *   - Flies to a new place when selectedPlace.id changes
 *   - Draggable marker — drag to refine the exact spot
 *   - Click anywhere on the map to reposition the marker
 *   - Lat/lng changes call onLocationUpdate({ latitude, longitude })
 *   - Does NOT do reverse geocoding (keep address label, update coords only)
 *   - Future: add reverseGeocode call in onDragEnd / handleMapClick
 *
 * Props:
 *   selectedPlace    object   — normalized Place (must not be null when rendered)
 *   onLocationUpdate ({ latitude, longitude }) => void
 *   onMapMove        ({ latitude, longitude }) => void  — optional; called when the
 *                    user pans the map so the parent can update its search context.
 */
const MapLocationPreview = ({ selectedPlace, onLocationUpdate, onMapMove }) => {
  const mapRef = useRef(null);
  const [markerPos, setMarkerPos] = useState({
    latitude:  selectedPlace.latitude,
    longitude: selectedPlace.longitude,
  });

  // Fly to + reposition marker when a new place is selected
  useEffect(() => {
    setMarkerPos({
      latitude:  selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });

    if (mapRef.current) {
      mapRef.current.flyTo({
        center:   [selectedPlace.longitude, selectedPlace.latitude],
        zoom:     15,
        duration: 800,
      });
    }
    // intentionally keyed on place id so it also re-centers when coords change externally
  }, [selectedPlace.id, selectedPlace.latitude, selectedPlace.longitude]);

  const applyNewPosition = (latitude, longitude) => {
    const updated = { latitude, longitude };
    setMarkerPos(updated);
    onLocationUpdate(updated);
    // Future reverse-geocode hook point:
    // reverseGeocode(latitude, longitude).then(place => onAddressUpdate(place));
  };

  const handleDragEnd = (event) => {
    applyNewPosition(event.lngLat.lat, event.lngLat.lng);
  };

  const handleMapClick = (event) => {
    applyNewPosition(event.lngLat.lat, event.lngLat.lng);
  };

  const handleMoveEnd = () => {
    if (!onMapMove || !mapRef.current) return;
    const map    = mapRef.current;
    const center = map.getCenter();
    const b      = map.getBounds?.();
    onMapMove({
      latitude:  center.lat,
      longitude: center.lng,
      bounds: b
        ? { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }
        : null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 200 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
      style={{ borderRadius: "0.75rem" }}
    >
      <div style={{ position: "relative", width: "100%", height: 200 }}>
        <Map
          ref={mapRef}
          initialViewState={{
            latitude:  selectedPlace.latitude,
            longitude: selectedPlace.longitude,
            zoom: 15,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
          onMoveEnd={handleMoveEnd}
          onStyleImageMissing={(e) => {
            const map = e.target;
            if (!map.hasImage(e.id)) {
              map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
            }
          }}
        >
          <Marker
            latitude={markerPos.latitude}
            longitude={markerPos.longitude}
            anchor="bottom"
            draggable
            onDragEnd={handleDragEnd}
          >
            {/* Custom pin */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                background: "linear-gradient(135deg, #DC2E73, #FB4040)",
                boxShadow: "0 2px 8px rgba(220,46,115,0.6), 0 0 0 3px rgba(220,46,115,0.2)",
                cursor: "grab",
              }}
            />
          </Marker>
        </Map>

        {/* Hint overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-1.5"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            Drag pin or tap map to refine exact location
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapLocationPreview;
