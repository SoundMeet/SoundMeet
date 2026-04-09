import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const MyJamsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TicketIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
  </svg>
);

// ─── Success state ─────────────────────────────────────────────────────────────

const SuccessState = ({ show, accentColor, onGoToMyJams, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center text-center px-8 py-10"
  >
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6"
      style={{
        background: `linear-gradient(135deg, ${accentColor}28, ${accentColor}18)`,
        color: accentColor,
        boxShadow: `0 0 0 1px ${accentColor}38, 0 0 28px ${accentColor}14`,
      }}
    >
      <CheckCircleIcon />
    </motion.div>

    <h2 className="text-[22px] font-bold text-white tracking-tight mb-2">
      You're going!
    </h2>
    <p className="text-sm font-semibold mb-3" style={{ color: accentColor }}>
      {show?.title}
    </p>
    <p className="text-sm leading-relaxed mb-8 max-w-[280px]"
      style={{ color: "rgba(229,226,225,0.45)" }}>
      Your RSVP is confirmed. This show will appear in My Jams.
    </p>

    <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
      <button
        onClick={onGoToMyJams}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
      >
        <MyJamsIcon />
        Go to My Jams
      </button>
      <button
        onClick={onClose}
        className="text-xs font-medium pt-1 transition-opacity duration-150 hover:opacity-70"
        style={{ color: "rgba(229,226,225,0.28)" }}
      >
        Close
      </button>
    </div>
  </motion.div>
);

// ─── RSVPShowModal ─────────────────────────────────────────────────────────────

/**
 * RSVPShowModal — confirmation modal for RSVPing to a show.
 *
 * Props:
 *   isOpen                     boolean
 *   onClose                    () => void
 *   show                       normalized show item (title, dateTime, locationName, ticketPrice, ticketLink)
 *   accentColor                hex string
 *   onSubmit                   () => Promise<void>
 *   onSuccessNavigateToMyJams  () => void
 */
const RSVPShowModal = ({
  isOpen,
  onClose,
  show,
  accentColor = "#C8963E",
  onSubmit,
  onSuccessNavigateToMyJams,
}) => {
  // "confirm" | "submitting" | "success" | "error"
  const [phase, setPhase] = useState("confirm");
  const [errorMessage, setErrorMessage] = useState(null);

  const isSubmitting = phase === "submitting";
  const isSuccess = phase === "success";

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setPhase("confirm");
        setErrorMessage(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setPhase("submitting");
    setErrorMessage(null);
    try {
      await onSubmit?.();
      setPhase("success");
    } catch (err) {
      setErrorMessage(err?.message ?? "Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  const handleGoToMyJams = () => {
    onSuccessNavigateToMyJams?.();
    onClose();
  };

  const ticketLabel = show?.ticketPrice
    ? `RSVP · $${show.ticketPrice}`
    : "RSVP — Free";

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(200,150,62,0.07) 0%, rgba(0,0,0,0.72) 100%)",
            animation: "jamOverlayIn 0.22s ease forwards",
          }}
        />

        <Dialog.Content
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center outline-none"
          style={{ pointerEvents: "none" }}
          onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
          onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        >
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-[460px] flex flex-col overflow-hidden
              rounded-t-[1.5rem] max-h-[92vh]
              md:rounded-[1.5rem] md:max-h-[88vh]"
            style={{
              pointerEvents: "auto",
              background: "rgba(20,20,20,0.95)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              boxShadow: `0 0 60px rgba(229,226,225,0.03), 0 0 50px ${accentColor}1a, 0 -1px 0 ${accentColor}12`,
            }}
          >
            {/* ── Header ── */}
            {!isSuccess && (
              <div
                className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                    RSVP to Show
                  </Dialog.Title>
                  <p className="text-[11px] font-medium mt-0.5"
                    style={{ color: "rgba(229,226,225,0.32)" }}>
                    Confirm your spot — it'll appear in My Jams.
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button
                    aria-label="Close"
                    disabled={isSubmitting}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 disabled:opacity-40 flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(229,226,225,0.45)",
                      fontSize: "16px",
                    }}
                  >
                    ✕
                  </button>
                </Dialog.Close>
              </div>
            )}

            {/* ── Body ── */}
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  <SuccessState
                    show={show}
                    accentColor={accentColor}
                    onGoToMyJams={handleGoToMyJams}
                    onClose={onClose}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Show summary */}
                  <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    <div
                      className="rounded-xl px-4 py-3.5 space-y-1"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-sm font-bold text-white">{show?.title}</p>
                      {show?.dateTime && (
                        <p className="text-[12px]" style={{ color: "rgba(229,226,225,0.45)" }}>
                          {show.dateTime}
                        </p>
                      )}
                      {show?.locationName && (
                        <p className="text-[12px]" style={{ color: "rgba(229,226,225,0.30)" }}>
                          {show.locationName}
                        </p>
                      )}
                    </div>

                    {/* Ticket info */}
                    {show?.ticketPrice && (
                      <div
                        className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                        style={{
                          background: `${accentColor}0f`,
                          border: `1px solid ${accentColor}22`,
                        }}
                      >
                        <span style={{ color: accentColor }}><TicketIcon /></span>
                        <p className="text-[12px] font-medium" style={{ color: accentColor }}>
                          Tickets · ${show.ticketPrice}
                          {show.ticketLink && (
                            <> —{" "}
                              <a
                                href={show.ticketLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2"
                              >
                                Buy now
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Error message */}
                    <AnimatePresence>
                      {phase === "error" && errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                          style={{
                            background: "rgba(251,64,64,0.08)",
                            border: "1px solid rgba(251,64,64,0.18)",
                            color: "#FB7070",
                          }}
                          role="alert"
                        >
                          {errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
                    style={{ borderTop: `1px solid ${accentColor}12` }}
                  >
                    <button
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(229,226,225,0.5)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{
                        background: isSubmitting
                          ? "rgba(255,255,255,0.1)"
                          : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                      }}
                    >
                      {isSubmitting ? "Saving…" : ticketLabel}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RSVPShowModal;
