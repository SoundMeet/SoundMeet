import React from "react";
import { Popup } from "react-map-gl/maplibre";

const STATUS_LABEL = {
  now:   { text: "LIVE NOW",       style: "bg-purple-600 text-white" },
  soon:  { text: "STARTING SOON",  style: "bg-purple-900 text-purple-200" },
  later: { text: "UPCOMING",       style: "bg-yellow-900 text-yellow-300" },
};

const JamPopup = ({ pin, onClose }) => (
  <Popup
    latitude={pin.lat}
    longitude={pin.lng}
    anchor="bottom"
    offset={[0, -48]}
    closeButton={false}
    closeOnClick={false}
    onClose={onClose}
  >
    <div className="bg-neutral-900 text-white rounded-xl p-4 w-56 shadow-xl">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_LABEL[pin.status].style}`}>
        {STATUS_LABEL[pin.status].text}
      </span>

      <h3 className="text-base font-bold mt-2">{pin.name}</h3>
      <p className="text-xs text-neutral-400 mt-1">{pin.time}</p>
      <p className="text-xs text-neutral-300 mt-1 font-medium">{pin.genre}</p>

      <div className="flex flex-wrap gap-1 mt-2">
        {pin.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </Popup>
);

export default JamPopup;
