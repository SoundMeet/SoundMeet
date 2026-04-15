import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * UserLocationMarker — "You are here" indicator for the map.
 *
 * Uses the standard blue dot pattern familiar from native mapping apps.
 * Rendered inside a react-map-gl <Marker> in MapComponent.
 *
 * Visual layers (outer → inner):
 *   1. Soft blue pulse ring (animate-ping) — draws the eye; remounts on recenterKey change
 *   2. Solid blue accent ring — separates dot from map
 *   3. White border ring — ensures visibility on any map color
 *   4. Blue dot core — the precise location point
 *
 * Props:
 *   recenterKey {number} - Incrementing this remounts the pulse ring,
 *                          retriggering the ping animation as recenter feedback.
 */
const UserLocationMarker = ({ recenterKey = 0 }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 28, height: 28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* "You" pill label — appears on hover above the dot */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="you-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              padding: "2px 7px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              background: "rgba(10,10,10,0.82)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            You
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring — key forces remount on recenter, restarting the animation */}
      <div
        key={recenterKey}
        className="absolute rounded-full animate-ping opacity-25"
        style={{ width: 28, height: 28, backgroundColor: "#3B82F6" }}
      />
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full opacity-30"
        style={{ width: 22, height: 22, backgroundColor: "#3B82F6" }}
      />
      {/* White border */}
      <div
        className="absolute rounded-full"
        style={{
          width: 16,
          height: 16,
          backgroundColor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
      {/* Blue dot core */}
      <div
        className="absolute rounded-full"
        style={{
          width: 11,
          height: 11,
          backgroundColor: "#3B82F6",
          boxShadow: "0 0 6px rgba(59,130,246,0.6)",
        }}
      />
    </div>
  );
};

export default UserLocationMarker;
