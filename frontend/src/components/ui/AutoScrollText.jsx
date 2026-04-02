/**
 * AutoScrollText — renders text, truncating with an ellipsis if it overflows.
 * Auto-scroll is disabled; text is always static.
 *
 * Props:
 *   children  {string}  — Text content
 *   className {string}  — Applied to the outer container
 *   style     {object}  — Applied to the outer container
 *   duration  {string}  — Unused, kept for API compatibility
 */
const AutoScrollText = ({ children, className = "", style }) => (
  <div className={`overflow-hidden ${className}`} style={style}>
    <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {children}
    </span>
  </div>
);

export default AutoScrollText;
