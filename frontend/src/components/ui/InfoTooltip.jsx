import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * InfoTooltip — small floating contextual hint
 *
 * Props:
 *   content  string | ReactNode  — tooltip body
 *   side     "top" | "bottom"    — default "top"
 */
const InfoTooltip = ({ content, side = "top" }) => {
  const [visible, setVisible] = useState(false);

  const isTop = side === "top";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="More information"
        className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold cursor-help select-none"
        style={{
          background: "rgba(220,46,115,0.15)",
          color: "#DC2E73",
          flexShrink: 0,
        }}
      >
        ?
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: isTop ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: isTop ? 4 : -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            style={{
              minWidth: "200px",
              bottom: isTop ? "calc(100% + 10px)" : "auto",
              top: isTop ? "auto" : "calc(100% + 10px)",
            }}
          >
            <div
              className="text-xs px-3 py-2 leading-relaxed"
              style={{
                background: "#2A2A2A",
                borderRadius: "0.75rem",
                color: "rgba(229,226,225,0.8)",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(220,46,115,0.1)",
              }}
            >
              {content}
            </div>
            {/* Arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={
                isTop
                  ? {
                      top: "100%",
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "5px solid #2A2A2A",
                    }
                  : {
                      bottom: "100%",
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderBottom: "5px solid #2A2A2A",
                    }
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoTooltip;
