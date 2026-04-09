import { useState } from "react";

// Descriptions at or under this length render as a compact secondary line
const SHORT_THRESHOLD = 160;
// Descriptions over this length get a collapse toggle
const EXPAND_THRESHOLD = 280;

/**
 * EventDescriptionSection — description text with progressive disclosure.
 *   - Short  (≤ 160 chars): compact inline, visually secondary, no toggle
 *   - Medium (161–280 chars): full text, no toggle
 *   - Long   (> 280 chars):  clamped with expand/collapse
 */
const EventDescriptionSection = ({ description }) => {
  const [expanded, setExpanded] = useState(false);

  if (!description) return null;

  const isShort = description.length <= SHORT_THRESHOLD;
  const isLong = description.length > EXPAND_THRESHOLD;
  const showClamp = isLong && !expanded;

  if (isShort) {
    return (
      <div className="px-7 pb-3">
        <p className="text-[13px] text-neutral-500 leading-relaxed">{description}</p>
      </div>
    );
  }

  return (
    <div className="px-7 pb-4">
      <p
        className="text-sm text-neutral-300 leading-relaxed"
        style={
          showClamp
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : {}
        }
      >
        {description}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[12px] font-medium text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default EventDescriptionSection;
