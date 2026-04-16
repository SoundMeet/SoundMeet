import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

import JoinTypeSelector from "./JoinTypeSelector";
import JoinJamSuccessState from "./JoinJamSuccessState";
import SearchableTagPicker from "../ui/SearchableTagPicker";
import { useFormOptions } from "../../hooks/useFormOptions";
import { buildJoinJamPayload } from "../../utils/buildJoinJamPayload";
import { downloadJamCalendarEvent } from "../../utils/generateJamIcs";

// ─── Form state helpers ───────────────────────────────────────────────────────

const tagGroup = () => ({ selectedIds: [], customValues: [] });

const INITIAL_FORM = {
  attendanceType: null, // "play" | "watch"
  instruments: tagGroup(),
  roles: tagGroup(),
  equipmentOfferings: tagGroup(),
};

// ─── Tag group handler factory (module-level) ─────────────────────────────────

/**
 * Returns the three SearchableTagPicker callbacks for a tag group field.
 * Uses the functional setForm updater so closures are always correct.
 */
const makeTagHandlers = (setForm, field) => ({
  onTogglePreset: (id) =>
    setForm((prev) => {
      const g = prev[field];
      const ids = g.selectedIds.includes(id)
        ? g.selectedIds.filter((i) => i !== id)
        : [...g.selectedIds, id];
      return { ...prev, [field]: { ...g, selectedIds: ids } };
    }),
  onAddCustom: (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        customValues: [...prev[field].customValues, val],
      },
    })),
  onRemoveCustom: (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        customValues: prev[field].customValues.filter((v) => v !== val),
      },
    })),
});

// ─── Internal primitives ──────────────────────────────────────────────────────

const Divider = () => (
  <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

const GroupLabel = ({ children }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-[0.14em]"
    style={{ color: "rgba(229,226,225,0.2)" }}
  >
    {children}
  </p>
);

// ─── JoinJamModal ─────────────────────────────────────────────────────────────

/**
 * JoinJamModal — handles join / request-to-join flows for public & private jams.
 *
 * Props:
 *   isOpen                      boolean
 *   onClose                     () => void
 *   jam                         {
 *                                 id, title, isPrivate,
 *                                 dateTime?, locationLabel?,
 *                                 instrumentsNeeded?, rolesNeeded?, equipmentNeeded?
 *                               }
 *   currentUser?                { id, name? }
 *   onSubmit?                   (payload) => Promise<void> | void
 *   onSuccessNavigateToMyJams?  () => void
 */
const JoinJamModal = ({
  isOpen,
  onClose,
  jam,
  currentUser,
  onSubmit,
  onSuccessNavigateToMyJams,
  onSuccessNavigateToGroupChat,
}) => {
  const { options } = useFormOptions()
  const [form, setForm] = useState(INITIAL_FORM);
  // "form" | "submitting" | "success" | "error"
  const [phase, setPhase] = useState("form");
  const [errorMessage, setErrorMessage] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const isPrivate = jam?.isPrivate ?? false;
  const isPlay = form.attendanceType === "play";
  const isSubmitting = phase === "submitting";
  const isSuccess = phase === "success";
  const canSubmit = form.attendanceType !== null && !isSubmitting;

  // Prefer jam-provided options; fall back to DB options
  const instrumentOptions =
    jam?.instrumentsNeeded?.length > 0
      ? jam.instrumentsNeeded
      : (options?.instruments ?? []);

  const roleOptions =
    jam?.rolesNeeded?.length > 0
      ? jam.rolesNeeded
      : (options?.roles ?? []);

  const equipmentOptions =
    jam?.equipmentNeeded?.length > 0
      ? jam.equipmentNeeded
      : (options?.equipmentNeeded ?? []);

  // Reset when modal closes (after exit animation)
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setForm(INITIAL_FORM);
        setPhase("form");
        setErrorMessage(null);
        setConversationId(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("submitting");
    setErrorMessage(null);

    const payload = buildJoinJamPayload(jam.id, isPrivate, form);

    try {
      const convId = await onSubmit?.(payload);
      setConversationId(convId ?? null);
      setPhase("success");
    } catch (err) {
      setErrorMessage(
        err?.message ?? "Something went wrong. Please try again."
      );
      setPhase("error");
    }
  };

  const handleGoToMyJams = () => {
    onSuccessNavigateToMyJams?.();
    onClose();
  };

  const handleGoToGroupChat = (onSuccessNavigateToGroupChat && conversationId)
    ? () => { onSuccessNavigateToGroupChat(conversationId); onClose(); }
    : null;

  const handleDownloadCalendar = () => {
    if (jam) downloadJamCalendarEvent(jam);
  };

  // Disable ESC while submitting
  const handleOpenChange = (open) => {
    if (!open && !isSubmitting) onClose();
  };

  // ── Derived labels ───────────────────────────────────────────────────────────

  const modalTitle = isPrivate ? "Request to Join" : "Join Jam";
  const modalSubtitle = isPrivate
    ? "The host will review your request."
    : "You'll be added right away.";
  const submitLabel = isSubmitting
    ? isPrivate
      ? "Sending…"
      : "Joining…"
    : isPrivate
    ? "Send Request"
    : "Join Jam";

  // Calendar button only available for confirmed (public) jams with a date
  const calendarHandler =
    !isPrivate && jam?.dateTime ? handleDownloadCalendar : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* ── Overlay ─────────────────────────────────────────────────────── */}
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(220,46,115,0.07) 0%, rgba(0,0,0,0.72) 100%)",
            animation: "jamOverlayIn 0.22s ease forwards",
          }}
        />

        {/* ── Centered container ───────────────────────────────────────────── */}
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
            className="w-full md:w-[500px] flex flex-col overflow-hidden
              rounded-t-[1.5rem] max-h-[92dvh]
              md:rounded-[1.5rem] md:max-h-[88vh]"
            style={{
              pointerEvents: "auto",
              background: "rgba(20,20,20,0.95)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              boxShadow:
                "0 0 60px rgba(229,226,225,0.03), 0 0 50px rgba(220,46,115,0.1), 0 -1px 0 rgba(220,46,115,0.07)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
              className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div>
                <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                  {modalTitle}
                </Dialog.Title>
                <p
                  className="text-[11px] font-medium mt-0.5"
                  style={{ color: "rgba(229,226,225,0.32)" }}
                >
                  {modalSubtitle}
                </p>
              </div>

              {!isSuccess && (
                <Dialog.Close asChild>
                  <button
                    aria-label="Close"
                    disabled={isSubmitting}
                    className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 disabled:opacity-40 flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(229,226,225,0.45)",
                      fontSize: "16px",
                    }}
                  >
                    ✕
                  </button>
                </Dialog.Close>
              )}
            </div>

            {/* ── Body — swaps between form and success state ─────────────── */}
            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* ── Success ────────────────────────────────────────────── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  <JoinJamSuccessState
                    jam={jam}
                    isPrivate={isPrivate}
                    onGoToMyJams={handleGoToMyJams}
                    onDownloadCalendar={calendarHandler}
                    onGoToGroupChat={handleGoToGroupChat}
                    onClose={onClose}
                  />
                </motion.div>
              ) : (
                /* ── Form ───────────────────────────────────────────────── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Scrollable form body */}
                  <div
                    className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {/* Jam summary card — shown when date or location available */}
                    {(jam?.dateTime || jam?.locationLabel) && (
                      <div
                        className="rounded-xl px-4 py-3"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <p className="text-sm font-semibold text-white truncate">
                          {jam.title}
                        </p>
                        {jam.dateTime && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "rgba(229,226,225,0.38)" }}
                          >
                            {jam.dateTime}
                          </p>
                        )}
                        {jam.locationLabel && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "rgba(229,226,225,0.26)" }}
                          >
                            {jam.locationLabel}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Join type selector */}
                    <JoinTypeSelector
                      value={form.attendanceType}
                      onChange={(type) =>
                        setForm((prev) => ({ ...prev, attendanceType: type }))
                      }
                    />

                    {/* Play-specific fields — animated in/out */}
                    <AnimatePresence initial={false}>
                      {isPlay && (
                        <motion.div
                          key="play-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-5 pt-1">
                            <Divider />
                            <GroupLabel>Playing</GroupLabel>

                            <SearchableTagPicker
                              title="Instrument"
                              placeholder="Search instruments…"
                              options={instrumentOptions}
                              selectedIds={form.instruments.selectedIds}
                              customValues={form.instruments.customValues}
                              {...makeTagHandlers(setForm, "instruments")}
                              maxVisible={8}
                            />

                            <SearchableTagPicker
                              title="Role"
                              placeholder="Search roles…"
                              options={roleOptions}
                              selectedIds={form.roles.selectedIds}
                              customValues={form.roles.customValues}
                              {...makeTagHandlers(setForm, "roles")}
                              maxVisible={8}
                              helperText="What role will you be taking on?"
                            />

                            <Divider />
                            <GroupLabel>Gear</GroupLabel>

                            <SearchableTagPicker
                              title="What you can bring"
                              placeholder="Search gear…"
                              options={equipmentOptions}
                              selectedIds={form.equipmentOfferings.selectedIds}
                              customValues={
                                form.equipmentOfferings.customValues
                              }
                              {...makeTagHandlers(setForm, "equipmentOfferings")}
                              maxVisible={8}
                              helperText="Gear you're willing to bring to the jam."
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>


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

                  {/* ── Footer ────────────────────────────────────────────── */}
                  <div
                    className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
                    style={{ borderTop: "1px solid rgba(220,46,115,0.07)" }}
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
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #DC2E73, #FB4040)",
                      }}
                    >
                      {submitLabel}
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

export default JoinJamModal;
