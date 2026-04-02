import { useState } from "react";

const MAX_COLLAPSED_LINES = 4;
// Approximate character threshold before showing expand toggle
const EXPAND_THRESHOLD = 220;

/**
 * EventDescriptionSection — description text with expand/collapse for long content.
 */
const EventDescriptionSection = ({ description }) => {
  const [expanded, setExpanded] = useState(false);

  if (!description) return null;

  const isLong = description.length > EXPAND_THRESHOLD;
  const showExpand = isLong && !expanded;

  return (
    <div className="px-7 py-5">
      <p
        className="text-sm text-neutral-300 leading-relaxed"
        style={
          showExpand
            ? {
                display: "-webkit-box",
                WebkitLineClamp: MAX_COLLAPSED_LINES,
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
