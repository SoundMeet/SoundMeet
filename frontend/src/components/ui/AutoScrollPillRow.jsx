/**
 * AutoScrollPillRow — renders a horizontal row of pill chips.
 *
 * Row behaviour:
 *   - All pills fit → normal flex row, no scroll
 *   - Too many pills → row becomes horizontally scrollable (hidden scrollbar)
 *
 * Per-pill behaviour:
 *   - Labels are clipped at max-width with overflow:hidden — no animation
 *
 * Props:
 *   pills     {string[]}  — Display labels (already uppercase/formatted)
 *   className {string}    — Applied to the outer row container
 */

const GAP = "6px";
const PILL_MAX_WIDTH = 120;

const Pill = ({ label }) => (
  <span
    className="shrink-0 inline-flex items-center px-2.5 py-[5px] rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-300 bg-white/[0.05] border border-white/[0.1] overflow-hidden"
    style={{ maxWidth: PILL_MAX_WIDTH }}
  >
    <span style={{ whiteSpace: "nowrap" }}>{label}</span>
  </span>
);

const AutoScrollPillRow = ({ pills = [], className = "" }) => {
  if (!pills.length) return null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: GAP,
        flexWrap: "nowrap",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      }}
    >
      {pills.map((p) => (
        <Pill key={p} label={p} />
      ))}
    </div>
  );
};

export default AutoScrollPillRow;
