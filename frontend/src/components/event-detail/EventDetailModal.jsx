import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  getDiscoveryAccentColor,
  hexToRgba,
} from "../../utils/discovery";
import {
  getEventLifecycleState,
  getUserEventRelationship,
  canRevealExactLocation,
} from "../../utils/eventComputed";
import {
  validateJamCoreDetails,
} from "../../utils/validateJamCoreDetails";
import { useFormOptions } from "../../hooks/useFormOptions";
import { jamService } from "../../injectables/jamService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../injectables/Auth";

import EventModalHeader from "./EventModalHeader";
import EventAttendanceSection from "./EventAttendanceSection";
import EventDescriptionSection from "./EventDescriptionSection";
import EventTagsSection from "./EventTagsSection";
import EventPermissionsNotice from "./EventPermissionsNotice";
import EventLogisticsSection from "./EventLogisticsSection";
import EventHostSection from "./EventHostSection";
import EventAdminActions from "./EventAdminActions";
import EventSafetyActions from "./EventSafetyActions";
import EventFooterActions from "./EventFooterActions";
import { RateJamSheet } from "./RateJamSheet";
import { DestructiveConfirmSheet } from "./DestructiveConfirmSheet";
import JamInlineEditForm from "./JamInlineEditForm";

import JamDetailSections from "./sections/JamDetailSections";
import ShowDetailSections from "./sections/ShowDetailSections";
import JoinBandDetailSections from "./sections/JoinBandDetailSections";
import FindBandmateDetailSections from "./sections/FindBandmateDetailSections";

/** Thin horizontal rule between sections */
const Divider = () => (
  <div className="mx-7 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

/**
 * ParticipationConfirmation — compact body panel shown when the viewer is an
 * approved attendee. Reinforces the joined state in the scroll body without
 * duplicating the header pill or footer CTA.
 *
 * Intentionally subtle: left accent bar, faint tint, dark-premium styling.
 * No harsh success-green — colour language matches the event type family.
 */
const CheckCircleIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ParticipationConfirmation = ({ item, accent }) => {
  const isShow = item.type === "promote_show";
  const headline = isShow
    ? "You're registered for this show"
    : "You're going to this jam";
  const note = "This event will appear in My Jams";

  return (
    <div className="px-7 pb-3">
      <div
        className="relative overflow-hidden rounded-xl px-4 py-3 flex items-start gap-3"
        style={{
          background: hexToRgba(accent, 0.06),
          border: `1px solid ${hexToRgba(accent, 0.15)}`,
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 inset-y-0 w-[3px] rounded-l-xl"
          style={{ background: accent, opacity: 0.65 }}
          aria-hidden="true"
        />
        <span className="shrink-0 mt-[1px]" style={{ color: accent }}>
          <CheckCircleIcon />
        </span>
        <div className="min-w-0">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: accent }}
          >
            {headline}
          </p>
          <p className="text-[11.5px] text-neutral-500 mt-[3px] leading-snug">
            {note}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Default viewer context ───────────────────────────────────────────────────

const DEFAULT_VIEWER_CONTEXT = {
  isCreator: false,
  isAdmin: false,
  isAttendee: false,
  joinState: null,
  isPastEvent: false,
};

// ─── Form initializer: item → edit form state ─────────────────────────────────

const tagGroup = (presetIds = []) => ({ presetIds, customValues: [] });

const padTwo = (n) => String(n).padStart(2, "0");

/**
 * Reverse-maps a list of display names to their option IDs.
 * Falls back gracefully if an option isn't found (e.g. custom values).
 */
function namesToIds(names, optionList) {
  if (!names?.length || !optionList?.length) return [];
  return names
    .map((name) => optionList.find((o) => o.label === name)?.id)
    .filter(Boolean);
}

/**
 * Build the edit form initial state from a normalized jam item + loaded options.
 * Called once when the creator enters edit mode.
 */
function mapItemToJamForm(item, options) {
  const parseDt = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const startDt = parseDt(item.dateTimeRaw);
  const endDt   = parseDt(item.endDateTimeRaw);

  const date      = startDt
    ? `${startDt.getFullYear()}-${padTwo(startDt.getMonth() + 1)}-${padTwo(startDt.getDate())}`
    : "";
  const startTime = startDt
    ? `${padTwo(startDt.getHours())}:${padTwo(startDt.getMinutes())}`
    : "";
  const endTime   = endDt
    ? `${padTwo(endDt.getHours())}:${padTwo(endDt.getMinutes())}`
    : "";

  const genreIds      = namesToIds(item.genres,             options?.genres);
  const vibeIds       = namesToIds(item.vibes,              options?.vibes);
  const instrumentIds = namesToIds(item.instrumentsNeeded,  options?.instruments);
  const roleIds       = namesToIds(item.rolesNeeded,        options?.rolesNeeded);
  const gearProvIds   = namesToIds(item.gearProvidedItems,  options?.equipmentAvailable);
  const gearNeedIds   = namesToIds(item.gearNeededItems,    options?.equipmentNeeded);

  // jamType is stored in the DB using its option ID (e.g. 'open-jam')
  const jamTypeId = item.jamType ? [item.jamType] : [];

  const selectedPlace = item.coordinates
    ? {
        placeName: item.locationName  ?? "",
        address:   item.locationAddress ?? "",
        latitude:  item.coordinates.latitude,
        longitude: item.coordinates.longitude,
      }
    : null;

  return {
    title:     item.title       ?? "",
    date,
    startTime,
    endTime,
    locationQuery: item.locationName ?? item.locationAddress ?? "",
    selectedPlace,
    locationGuide: item.locationGuide ?? "",

    genres:             tagGroup(genreIds),
    vibes:              tagGroup(vibeIds),
    instrumentsNeeded:  tagGroup(instrumentIds),
    jamTypes:           tagGroup(jamTypeId),
    rolesNeeded:        tagGroup(roleIds),
    equipmentAvailable: tagGroup(gearProvIds),
    equipmentNeeded:    tagGroup(gearNeedIds),
    skillLevel:         item.skillLevel ?? null,

    isOpenToAllGenres:      !item.genres?.length,
    isOpenToAllVibes:       !item.vibes?.length,
    isOpenToAllInstruments: !item.instrumentsNeeded?.length,

    description:    item.description ?? "",
    maxParticipants: item.capacity ? String(item.capacity) : "",
    isPrivate:       item.isPrivate ?? false,

    // Existing image: previewUrl set, file null (only uploaded if user picks new one)
    coverImage: item.coverImageUrl
      ? { file: null, previewUrl: item.coverImageUrl }
      : null,
  };
}

// ─── EventDetailModal ─────────────────────────────────────────────────────────

/**
 * EventDetailModal — single canonical event/jam detail modal used across the app.
 *
 * Props:
 *   item           {Object}    Discovery item (jam, promote_show, join_band, find_bandmate)
 *   open           {boolean}
 *   onClose        {Function}  Called when modal should close
 *   viewerContext  {Object?}   Viewer relationship to the event
 *   onJoin         {Function?} Called when viewer clicks primary join CTA
 *   onEdit         {Function?} Called when creator clicks Edit on non-jam events; receives item
 *   onDelete       {Function?} Async mutation called after creator confirms Delete
 *   onLeave        {Function?} Async mutation called after attendee confirms Leave
 *   onRate         {Function?}
 *   onSaved        {Function?} Called after a successful in-place jam edit; receives updated item
 */
const EventDetailModal = ({
  item,
  open,
  onClose,
  viewerContext,
  onJoin,
  onRsvp,
  onEdit,
  onDelete,
  onLeave,
  onRate,
  onSaved,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Augment viewerContext: if admin_id matches the current user they're the creator,
  // regardless of what the parent passed (e.g. MyJams "Jams I'm Going" tab only
  // sets isAttendee and never checks admin_id).
  const ctx = (() => {
    const base = { ...DEFAULT_VIEWER_CONTEXT, ...viewerContext };
    if (!base.isCreator && !base.isAdmin && item?.admin_id != null && user?.id != null) {
      if (String(item.admin_id) === String(user.id)) {
        return { ...base, isCreator: true };
      }
    }
    return base;
  })();

  // ── Form options for jam editing ────────────────────────────────────────────
  // Loaded once at modal mount; used only when isEditing becomes true.
  const { options } = useFormOptions();

  // ── Local item state ────────────────────────────────────────────────────────
  // Allows immediate post-save refresh without waiting for parent re-fetch.
  const [localItem, setLocalItem] = useState(item);
  useEffect(() => {
    if (item) setLocalItem(item);
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Standard sheet state ───────────────────────────────────────────────────
  const [rateSheetOpen,    setRateSheetOpen]    = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [deleteConfirmOpen,setDeleteConfirmOpen]= useState(false);
  const [actionLoading,    setActionLoading]    = useState(false);

  // ── In-place edit state (jams only) ───────────────────────────────────────
  const [isEditing,         setIsEditing]         = useState(false);
  const [editForm,          setEditForm]           = useState(null);
  const [editErrors,        setEditErrors]         = useState({});
  const [editTouched,       setEditTouched]        = useState({});
  const [isSaving,          setIsSaving]           = useState(false);
  const [saveError,         setSaveError]          = useState(null);
  const [discardConfirmOpen,setDiscardConfirmOpen] = useState(false);
  const editInitialFormRef = useRef(null);

  // ── Computed state ──────────────────────────────────────────────────────────
  const accent           = getDiscoveryAccentColor(localItem);
  const lifecycle        = getEventLifecycleState(localItem, ctx);
  const relationship     = getUserEventRelationship(localItem, ctx);
  const canSeeLocation   = canRevealExactLocation(localItem, ctx);
  const isCreatorOrAdmin = relationship === "creator" || relationship === "admin";
  const isJam            = localItem?.type === "jam";
  // Jams owned by creator get in-place editing; everything else uses onEdit callback
  const canEditInPlace   = isJam && isCreatorOrAdmin;

  // ── Dirty check helper (ref-based so ESC handler stays stable) ────────────
  const editFormRef = useRef(null);
  editFormRef.current = editForm;

  const isEditDirty = () =>
    editFormRef.current &&
    editInitialFormRef.current &&
    JSON.stringify(editFormRef.current) !== JSON.stringify(editInitialFormRef.current);

  // ── Exit edit mode (no confirmation) ──────────────────────────────────────
  const exitEditMode = () => {
    setIsEditing(false);
    setEditForm(null);
    setEditErrors({});
    setEditTouched({});
    setSaveError(null);
  };

  // ── Enter edit mode ────────────────────────────────────────────────────────
  const handleEnterEdit = () => {
    const initial = mapItemToJamForm(localItem, options);
    editInitialFormRef.current = initial;
    setEditForm(initial);
    setEditErrors({});
    setEditTouched({});
    setSaveError(null);
    setIsEditing(true);
  };

  // ── Cancel edit (with dirty check) ────────────────────────────────────────
  // Keep in a ref so the ESC effect doesn't re-register on every form change.
  const handleCancelEditRef = useRef(null);
  handleCancelEditRef.current = () => {
    if (isEditDirty()) {
      setDiscardConfirmOpen(true);
    } else {
      exitEditMode();
    }
  };
  const handleCancelEdit = () => handleCancelEditRef.current?.();

  // ── Save changes ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editForm) return;

    // Validate core details
    const { errors: coreErrors, isValid } = validateJamCoreDetails(editForm);
    const hasLocationError = !editForm.selectedPlace;

    const allErrors = { ...coreErrors };
    if (hasLocationError) allErrors.selectedPlace = "Please search and select a location";

    // Touch all required fields so errors are visible
    setEditTouched({ title: true, date: true, startTime: true, selectedPlace: true });
    if (!isValid || hasLocationError) {
      setEditErrors(allErrors);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await jamService.updateJam(localItem.id, editForm);
      const refreshed = await jamService.getJamById(localItem.id);
      setLocalItem(refreshed);
      exitEditMode();
      showToast("Jam updated!", "success");
      onSaved?.(refreshed);
    } catch (err) {
      console.error("Update jam failed:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset state when modal closes ─────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setRateSheetOpen(false);
      setLeaveConfirmOpen(false);
      setDeleteConfirmOpen(false);
      setActionLoading(false);
      exitEditMode();
      setDiscardConfirmOpen(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── ESC handler ─────────────────────────────────────────────────────────────
  // In edit mode: delegate to cancel handler (dirty check inside).
  // In view mode: close modal as before.
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditing;

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (e.key !== "Escape") return;
      if (leaveConfirmOpen || deleteConfirmOpen || rateSheetOpen || discardConfirmOpen) return;
      if (isEditingRef.current) {
        handleCancelEditRef.current?.();
      } else {
        onClose();
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose, leaveConfirmOpen, deleteConfirmOpen, rateSheetOpen, discardConfirmOpen]);

  // ── Leave confirm ───────────────────────────────────────────────────────────
  const handleLeaveConfirm = async () => {
    setActionLoading(true);
    try {
      await onLeave?.(localItem);
      setLeaveConfirmOpen(false);
      onClose();
    } catch {
      setActionLoading(false);
    }
  };

  // ── Delete confirm ──────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await onDelete?.(localItem);
      setDeleteConfirmOpen(false);
      onClose();
    } catch {
      setActionLoading(false);
    }
  };

  if (!localItem) return null;

  const description = localItem.description ?? localItem.summary ?? null;
  const isShortDesc = description != null && description.length <= 160;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="edm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={
              !leaveConfirmOpen && !deleteConfirmOpen && !isEditing
                ? onClose
                : undefined
            }
            aria-hidden="true"
          />

          {/* ── Centering wrapper ─────────────────────────────────────────── */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={`edm-${localItem.id}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-detail-title"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-[600px] flex flex-col bg-neutral-900 border border-white/10 rounded-[28px] overflow-hidden pointer-events-auto"
              style={{
                maxHeight: "90vh",
                boxShadow: `0 0 80px rgba(0,0,0,0.9), 0 0 48px ${hexToRgba(accent, 0.12)}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ──────────────────────────────────────────────── */}
              <EventModalHeader
                item={localItem}
                lifecycle={lifecycle}
                relationship={relationship}
                accent={accent}
                onClose={isEditing ? handleCancelEdit : onClose}
                canSeeLocation={canSeeLocation}
                description={description}
                isEditing={isEditing}
              />

              {/* ── Scrollable body ───────────────────────────────────────── */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    /* ── Edit mode body ─────────────────────────────────── */
                    <JamInlineEditForm
                      key="edit-form"
                      form={editForm}
                      setForm={setEditForm}
                      errors={editErrors}
                      setErrors={setEditErrors}
                      touched={editTouched}
                      setTouched={setEditTouched}
                      options={options}
                    />
                  ) : (
                    /* ── View mode body ─────────────────────────────────── */
                    <motion.div
                      key="view-body"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="pt-3"
                    >
                      <EventAttendanceSection item={localItem} accent={accent} />
                      <EventPermissionsNotice item={localItem} viewerContext={ctx} />

                      {relationship === "approved" && (
                        <ParticipationConfirmation item={localItem} accent={accent} />
                      )}

                      {!isShortDesc && (
                        <EventDescriptionSection description={description} />
                      )}

                      <EventTagsSection item={localItem} accent={accent} />

                      {localItem.type === "jam"           && <JamDetailSections item={localItem} accent={accent} />}
                      {localItem.type === "promote_show"  && <ShowDetailSections item={localItem} accent={accent} />}
                      {localItem.type === "join_band"     && <JoinBandDetailSections item={localItem} />}
                      {localItem.type === "find_bandmate" && <FindBandmateDetailSections item={localItem} />}

                      <EventLogisticsSection item={localItem} />

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <EventHostSection
                          item={localItem}
                          accent={accent}
                          relationship={relationship}
                        />

                        {isCreatorOrAdmin && (
                          <>
                            <Divider />
                            <EventAdminActions
                              item={localItem}
                              onEdit={onEdit}
                              onEnterEdit={canEditInPlace ? handleEnterEdit : undefined}
                              onDelete={() => setDeleteConfirmOpen(true)}
                              onClose={onClose}
                            />
                          </>
                        )}

                        <EventSafetyActions item={localItem} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Footer ───────────────────────────────────────────────── */}
              {isEditing ? (
                /* Edit action bar */
                <div
                  className="px-7 py-3 shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {saveError && (
                    <p
                      className="text-xs text-center mb-2"
                      style={{ color: "#fb4040" }}
                    >
                      {saveError}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="shrink-0 h-9 px-5 rounded-full text-[13px] font-semibold transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(229,226,225,0.55)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.11)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 h-10 rounded-full text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: isSaving
                          ? "rgba(255,255,255,0.08)"
                          : accent,
                        color: "#FFFFFF",
                        boxShadow: isSaving
                          ? "none"
                          : `0 0 16px ${hexToRgba(accent, 0.4)}, 0 0 32px ${hexToRgba(accent, 0.2)}`,
                      }}
                    >
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <EventFooterActions
                  item={localItem}
                  lifecycle={lifecycle}
                  relationship={relationship}
                  accent={accent}
                  onJoin={onJoin}
                  onRsvp={onRsvp}
                  onEdit={onEdit}
                  onEnterEdit={canEditInPlace ? handleEnterEdit : undefined}
                  onLeave={() => setLeaveConfirmOpen(true)}
                  onDelete={() => setDeleteConfirmOpen(true)}
                  onClose={onClose}
                  onRate={() => setRateSheetOpen(true)}
                />
              )}
            </motion.div>
          </div>

          {/* ── Leave confirm sheet ────────────────────────────────────────── */}
          <DestructiveConfirmSheet
            open={leaveConfirmOpen}
            onClose={() => !actionLoading && setLeaveConfirmOpen(false)}
            onConfirm={handleLeaveConfirm}
            title="Leave this event?"
            body="You'll be removed from the attendee list and will lose your spot."
            confirmLabel="Leave Event"
            cancelLabel="Keep my spot"
            loading={actionLoading}
          />

          {/* ── Delete confirm sheet ───────────────────────────────────────── */}
          <DestructiveConfirmSheet
            open={deleteConfirmOpen}
            onClose={() => !actionLoading && setDeleteConfirmOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete this event?"
            body="Because you're the creator, this will permanently delete the event for everyone."
            bodyExtra={isJam ? "The jam chat will also be removed." : undefined}
            confirmLabel="Delete Event"
            cancelLabel="Never mind"
            loading={actionLoading}
          />

          {/* ── Discard edit confirm sheet ─────────────────────────────────── */}
          <DestructiveConfirmSheet
            open={discardConfirmOpen}
            onClose={() => setDiscardConfirmOpen(false)}
            onConfirm={() => {
              setDiscardConfirmOpen(false);
              exitEditMode();
            }}
            title="Discard changes?"
            body="You have unsaved edits. If you leave now, your changes will be lost."
            confirmLabel="Discard Changes"
            cancelLabel="Keep Editing"
            loading={false}
          />

          {/* ── Rate / review sheet ────────────────────────────────────────── */}
          <RateJamSheet
            open={rateSheetOpen}
            onClose={() => setRateSheetOpen(false)}
            item={localItem}
            onSubmit={(rating, comment) => {
              onRate?.(localItem, rating, comment);
              setRateSheetOpen(false);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailModal;
