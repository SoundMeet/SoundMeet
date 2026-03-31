import React, { useState, useEffect } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import MapPin from "./MapPin";
import JamPopup from "./JamPopup";

const MAP_STYLE = `https://api.maptiler.com/maps/019d0d5e-d7ec-7ed1-942f-952f70c3b58b/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`;

const MOCK_PINS = [
  {
    id: 1,
    lat: 25.755,
    lng: -80.374,
    noteIndex: 0,
    status: "now",
    name: "Jam Collective",
    time: "Happening Now",
    genre: "Jazz",
    tags: ["On Campus", "Improv", "Live"],
  },
  {
    id: 2,
    lat: 25.7562,
    lng: -80.371,
    noteIndex: 1,
    status: "soon",
    name: "test",
    time: "Starts at x:xx PM",
    genre: "testing",
    tags: ["1", "2", "3"],
  },
  {
    id: 3,
    lat: 25.752,
    lng: -80.376,
    noteIndex: 2,
    status: "later",
    name: "test2",
    time: "Tomorrow at xx:xx PM",
    genre: "testing2",
    tags: ["1", "2", "3"],
  },
  {
    id: 4,
    lat: 25.758,
    lng: -80.378,
    noteIndex: 3,
    status: "soon",
    name: "test3",
    time: "Starts at x:xx PM",
    genre: "testing3B",
    tags: ["1", "2"],
  },
];

const FALLBACK_COORDS = { latitude: 25.7562, longitude: -80.3755 };

const MapComponent = () => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [viewState, setViewState] = useState({
    ...FALLBACK_COORDS,
    zoom: 14,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setViewState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          zoom: 15,
        });
      },
      () => {
        // Permission denied or error — stay on fallback
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <Map
      initialViewState={viewState}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onClick={() => setSelectedPin(null)}
      onStyleImageMissing={(e) => {
        const map = e.target;
        if (!map.hasImage(e.id)) {
          const empty = { width: 1, height: 1, data: new Uint8Array(4) };
          map.addImage(e.id, empty);
        }
      }}
    >
      {MOCK_PINS.map((pin) => (
        <Marker
          key={pin.id}
          latitude={pin.lat}
          longitude={pin.lng}
          anchor="bottom"
        >
          <MapPin
            noteIndex={pin.noteIndex}
            status={pin.status}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPin(pin);
            }}
          />
        </Marker>
      ))}

      {selectedPin && (
        <JamPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
      )}
    </Map>
  );
};

export default MapComponent;
