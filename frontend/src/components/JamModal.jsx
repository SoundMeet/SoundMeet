import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * JamModal — detailed jam information modal.
 *
 * Opens from:
 *   - Double-clicking a jam card
 *   - Clicking "Join the Jam" on a jam card
 *   - Clicking "View Jam" in the hover preview
 *
 * Props:
 *   jam     {object}   - Full jam data object from mockJams
 *   open    {boolean}  - Controls visibility
 *   onClose {function} - Called to dismiss the modal
 *   onJoin  {function} - Called when Join the Jam is confirmed
 *                        TODO: wire up real join API call here (jam.id + user auth)
 */
const JamModal = ({ jam, open, onClose, onJoin }) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Capitalise first letter helper
  const cap = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

  return (
    <AnimatePresence>
      {open && jam && (
        <>
          {/* Backdrop — click outside to close */}
          <motion.div
            key="jam-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel wrapper — centers the modal, pointer-events-none so backdrop click works */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="jam-modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-[520px] bg-neutral-900 border border-white/10 rounded-[28px] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_40px_rgba(220,46,115,0.07)] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="px-7 pt-7 pb-5">
                {/* Status badges */}
                <div className="flex items-center gap-2 mb-3">
                  {jam.isLive && (
                    <span className="inline-flex items-center gap-1.5 h-5 px-2.5 rounded-xl bg-red-500 text-[10px] font-semibold text-white shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse">
                      ● LIVE
                    </span>
                  )}
                  {jam.isPrivate && (
                    <span className="h-5 px-2.5 flex items-center rounded-xl text-[10px] font-medium text-gray-400 border border-white/10">
                      Private
                    </span>
                  )}
                </div>

                {/* Title + close button */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {jam.title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all duration-150 text-base leading-none"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Subtitle meta */}
                <p className="text-sm text-gray-500 mt-1.5">
                  {[
                    jam.genre,
                    jam.locationName,
                    jam.distanceMiles != null && `${jam.distanceMiles} mi away`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-800 mx-7" />

              {/* ── Body ── */}
              <div className="px-7 py-5 space-y-5">
                {/* Tags */}
                {jam.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jam.tags.map((tag) => (
                      <span
                        key={tag}
                        className="h-7 px-3 flex items-center rounded-xl text-xs font-medium text-gray-300 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {jam.description && (
                  <p className="text-[14px] text-gray-300 leading-relaxed">
                    {jam.description}
                  </p>
                )}

                {/* Details grid — only renders rows with available data */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: "Host", value: jam.hostName },
                    { label: "Time", value: jam.dateTime },
                    { label: "Vibe", value: jam.vibe },
                    { label: "Skill level", value: jam.skillLevel },
                    {
                      label: "Instruments",
                      value: jam.instrumentNeeds?.length
                        ? jam.instrumentNeeds.map(cap).join(", ")
                        : null,
                    },
                    {
                      label: "Capacity",
                      value:
                        jam.capacity != null && jam.attendeeCount != null
                          ? `${jam.attendeeCount} / ${jam.capacity} spots`
                          : null,
                    },
                  ]
                    .filter((row) => row.value)
                    .map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">
                          {label}
                        </p>
                        <p className="text-sm text-gray-300">{value}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* ── Footer CTA ── */}
              <div className="px-7 pb-7">
                <div className="h-px bg-neutral-800 mb-5" />
                {jam.isPrivate ? (
                  <button
                    disabled
                    className="w-full h-12 rounded-3xl bg-neutral-800 text-gray-500 font-semibold text-sm border border-white/10 cursor-not-allowed"
                  >
                    INVITE ONLY
                  </button>
                ) : (
                  <button
                    onClick={onJoin}
                    className="w-full h-12 rounded-3xl bg-[#F7C10D] text-black font-bold text-sm tracking-wide shadow-[0_0_16px_rgba(247,193,13,0.7),0_0_32px_rgba(247,193,13,0.35)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
                  >
                    {/* TODO: connect to real join flow — pass jam.id to API, check auth */}
                    JOIN THE JAM
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default JamModal;
