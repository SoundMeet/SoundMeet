/**
 * UserLocationMarker — "You are here" indicator for the map.
 *
 * Uses the standard blue dot pattern familiar from native mapping apps.
 * Rendered inside a react-map-gl <Marker> in MapComponent.
 *
 * Visual layers (outer → inner):
 *   1. Soft blue pulse ring (animate-ping) — draws the eye
 *   2. Solid blue accent ring — separates dot from map
 *   3. White border ring — ensures visibility on any map color
 *   4. Blue dot core — the precise location point
 */
const UserLocationMarker = () => (
  <div className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
    {/* Pulse ring */}
    <div
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

export default UserLocationMarker;
