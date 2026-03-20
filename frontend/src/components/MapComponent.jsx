import React from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const MOCK_PINS = [
  { id: 1, lat: 40.748, lng: -73.985, label: "Jazz Collective" },
  { id: 2, lat: 40.754, lng: -73.991, label: "Kaeien Vance" },
  { id: 3, lat: 40.741, lng: -73.978, label: "Neon Sessions" },
];

const MapComponent = () => {
  return (
    <Map
      initialViewState={{
        latitude: 40.748,
        longitude: -73.985,
        zoom: 13,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
    >
      {MOCK_PINS.map((pin) => (
        <Marker key={pin.id} latitude={pin.lat} longitude={pin.lng}>
          <div className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg cursor-pointer hover:bg-pink-500 transition-colors">
            ♪
          </div>
        </Marker>
      ))}
    </Map>
  );
};

export default MapComponent;
