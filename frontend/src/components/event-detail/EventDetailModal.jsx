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
import { showService } from "../../injectables/showService";
import { chatService } from "../../injectables/chatService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../injectables/Auth";
import { useAuthModal } from "../../context/AuthModalContext";

import EventModalHeader from "./EventModalHeader";
import EventAttendanceSection from "./EventAttendanceSection";
import EventDescriptionSection from "./EventDescriptionSection";
import EventTagsSection from "./EventTagsSection";
import EventPermissionsNotice from "./EventPermissionsNotice";
import EventLogisticsSection from "./EventLogisticsSection";
import EventHostSection from "./EventHostSection";
import EventAdminActions from "./EventAdminActions";
import EventSafetyActions from "./EventSafetyActions";
import { ManageAttendeesModal } from "./ManageAttendeesModal";
import { JamFriendsPreview } from "./JamFriendsPreview";
import EventFooterActions from "./EventFooterActions";
import { RateJamSheet } from "./RateJamSheet";
import { DestructiveConfirmSheet } from "./DestructiveConfirmSheet";
import JamInlineEditForm from "./JamInlineEditForm";
import ShowInlineEditForm from "./ShowInlineEditForm";

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

const ParticipationConfirmation = ({ item, accent, chatLeftAt, onRejoinChat, rejoinLoading, canRejoin }) => {
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
        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: accent }}
          >
            {headline}
          </p>
          <p className="text-[11.5px] text-neutral-500 mt-[3px] leading-snug">
            {note}
          </p>

          {/* Chat left indicator + Rejoin — jams only */}
          {chatLeftAt && (
            <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[11px]" style={{ color: 'rgba(229,226,225,0.35)' }}>
                Chat left
              </span>
              {canRejoin ? (
                <button
                  onClick={onRejoinChat}
                  disabled={rejoinLoading}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all duration-150 disabled:opacity-40"
                  style={{ background: hexToRgba(accent, 0.13), color: accent, border: `1px solid ${hexToRgba(accent, 0.2)}` }}
                >
                  {rejoinLoading ? 'Rejoining…' : 'Rejoin Chat'}
                </button>
              ) : (
                <span className="text-[11px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
                  Jam ended
                </span>
              )}
            </div>
          )}
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

// ─── Form initializer: item → show edit form state ───────────────────────────

/**
 * Build the edit form initial state from a normalized show item + any existing lineup IDs.
 * Called once when the creator enters edit mode on a show.
 */
function mapItemToShowForm(item) {
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

  const selectedPlace = item.coordinates
    ? {
        placeName: item.locationName  ?? "",
        address:   item.locationAddress ?? "",
        latitude:  item.coordinates.latitude,
        longitude: item.coordinates.longitude,
      }
    : null;

  // Ensure each lineup act has a stable frontend id for React keys
  const lineup = (item.lineup ?? []).map((a) => ({
    ...a,
    id: a.id ?? crypto.randomUUID(),
  }));

  return {
    title:         item.title        ?? "",
    date,
    startTime,
    endTime,
    locationQuery: item.locationName ?? item.locationAddress ?? "",
    selectedPlace,
    locationGuide: item.locationGuide ?? "",
    description:   item.description  ?? "",
    genres:        { selectedIds: item.genreIds ?? [], customValues: [] },
    ticketPrice:   item.ticketPrice  != null ? String(item.ticketPrice)  : "",
    ticketLink:    item.ticketLink   ?? "",
    lineup,
    maxCapacity:   item.capacity     != null ? String(item.capacity)     : "",
    isPrivate:     item.isPrivate    ?? false,
    coverImage:    item.coverImageUrl
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
 *   standalone     {boolean?}  When true, renders as a full page panel (no backdrop/fixed overlay)
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
  standalone = false,
}) => {
  const { user } = useAuth();
  const { openModal } = useAuthModal();
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

  // ── Ratings summary (avg + count, fetched lazily on open for past jams) ────
  const [ratingSummary, setRatingSummary] = useState({ avg_rating: null, rating_count: 0 });

  // ── Chat membership state (jams only, approved attendees) ─────────────────
  const [jamConvId,     setJamConvId]     = useState(null);
  const [chatLeftAt,    setChatLeftAt]    = useState(null);
  const [rejoinLoading, setRejoinLoading] = useState(false);

  // ── In-place edit state (jams only) ───────────────────────────────────────
  const [isEditing,         setIsEditing]         = useState(false);
  const [editForm,          setEditForm]           = useState(null);
  const [editErrors,        setEditErrors]         = useState({});
  const [editTouched,       setEditTouched]        = useState({});
  const [isSaving,          setIsSaving]           = useState(false);
  const [saveError,         setSaveError]          = useState(null);
  const [discardConfirmOpen,setDiscardConfirmOpen] = useState(false);
  const [attendeesOpen,     setAttendeesOpen]      = useState(false);
  const editInitialFormRef = useRef(null);

  // ── Share handler ────────────────────────────────────────────────────────────
  const handleShare = () => {
    const type = localItem?.type === "promote_show" ? "show" : "jam";
    const url  = `${window.location.origin}/${type}/${localItem?.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    } else {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(el);
    }
    showToast("Link copied!", "success");
  };

  // ── Chat membership fetch (jam + approved attendee only) ─────────────────
  useEffect(() => {
    const isAttending = ctx.isAttendee || ctx.joinState === "approved";
    if (!open || localItem?.type !== "jam" || !isAttending || !user?.id || !localItem?.id) return;
    chatService.getJamChatStatus(localItem.id, user.id)
      .then((status) => {
        setJamConvId(status?.conversationId ?? null);
        setChatLeftAt(status?.leftAt ?? null);
      })
      .catch(() => {}); // non-critical — silently fail
  }, [open, localItem?.id, ctx.isAttendee, ctx.joinState, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ratings summary fetch (past jams only, public aggregate) ─────────────
  useEffect(() => {
    if (!open || !ctx.isPastEvent || localItem?.type !== "jam" || !localItem?.id) return;
    jamService.getJamRatingSummary(localItem.id)
      .then((data) => setRatingSummary(data))
      .catch(() => {}); // non-critical
  }, [open, localItem?.id, ctx.isPastEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open rate sheet — pre-fill with existing rating if available ──────────
  const handleOpenRateSheet = async () => {
    if (!user) { openModal('login'); return; }
    if (localItem?.rating == null && ctx.isPastEvent && localItem?.id) {
      try {
        const data = await jamService.fetchMyJamRating(localItem.id);
        if (data?.rating) {
          setLocalItem((prev) => ({ ...prev, rating: data.rating, ratingComment: data.comment }));
        }
      } catch (_) {}
    }
    setRateSheetOpen(true);
  };

  // ── Rejoin chat ────────────────────────────────────────────────────────────
  const handleRejoinChat = async () => {
    if (!jamConvId || !user?.id) return;
    setRejoinLoading(true);
    try {
      await chatService.rejoinJamChat(jamConvId, user.id);
      setChatLeftAt(null);
      showToast("Rejoined chat!", "success");
    } catch {
      showToast("Could not rejoin chat.", "error");
    } finally {
      setRejoinLoading(false);
    }
  };

  // ── Computed state ──────────────────────────────────────────────────────────
  const accent           = getDiscoveryAccentColor(localItem);
  const lifecycle        = getEventLifecycleState(localItem, ctx);
  const relationship     = getUserEventRelationship(localItem, ctx);
  const canSeeLocation   = canRevealExactLocation(localItem, ctx);
  const isCreatorOrAdmin = relationship === "creator" || relationship === "admin";
  const isJam            = localItem?.type === "jam";
  const isShow           = localItem?.type === "promote_show";
  // Jams and shows owned by creator/admin get in-place editing; other types use onEdit callback
  const canEditInPlace   = (isJam || isShow) && isCreatorOrAdmin;

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
    const initial = isJam
      ? mapItemToJamForm(localItem, options)
      : mapItemToShowForm(localItem);
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

    const allErrors = {};

    if (isJam) {
      // Validate via shared jam validator
      const { errors: coreErrors, isValid } = validateJamCoreDetails(editForm);
      Object.assign(allErrors, coreErrors);
      if (!editForm.selectedPlace) allErrors.selectedPlace = "Please search and select a location";
      setEditTouched({ title: true, date: true, startTime: true, selectedPlace: true });
      if (!isValid || allErrors.selectedPlace) {
        setEditErrors(allErrors);
        return;
      }
    } else if (isShow) {
      // Basic required-field validation for shows
      if (!editForm.title?.trim())  allErrors.title      = "Show title is required";
      if (!editForm.date)           allErrors.date       = "Date is required";
      if (!editForm.startTime)      allErrors.startTime  = "Start time is required";
      if (!editForm.selectedPlace)  allErrors.selectedPlace = "Please search and select a venue";
      setEditTouched({ title: true, date: true, startTime: true, selectedPlace: true });
      if (Object.keys(allErrors).length > 0) {
        setEditErrors(allErrors);
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      let refreshed;
      if (isJam) {
        await jamService.updateJam(localItem.id, editForm);
        refreshed = await jamService.getJamById(localItem.id);
        showToast("Jam updated!", "success");
      } else if (isShow) {
        await showService.updateShow(localItem.id, editForm);
        refreshed = await showService.getShowById(localItem.id);
        showToast("Show updated!", "success");
      }
      setLocalItem(refreshed);
      exitEditMode();
      onSaved?.(refreshed);
    } catch (err) {
      console.error("Update failed:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── URL sync (overlay mode only) ────────────────────────────────────────────
  // While the modal is open, reflect the event URL in the address bar so the
  // user can copy/share directly from the browser. Restores the original URL
  // on close without touching React Router history.
  const prevPathRef = useRef(null);
  useEffect(() => {
    if (standalone || !localItem?.id) return;
    if (open) {
      const type = localItem.type === "promote_show" ? "show" : "jam";
      const url  = `/${type}/${localItem.id}`;
      if (window.location.pathname !== url) {
        prevPathRef.current = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", url);
      }
    } else {
      if (prevPathRef.current) {
        window.history.replaceState(null, "", prevPathRef.current);
        prevPathRef.current = null;
      }
    }
  }, [open, localItem?.id, standalone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset state when modal closes ─────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setRateSheetOpen(false);
      setLeaveConfirmOpen(false);
      setDeleteConfirmOpen(false);
      setActionLoading(false);
      exitEditMode();
      setDiscardConfirmOpen(false);
      setAttendeesOpen(false);
      setJamConvId(null);
      setChatLeftAt(null);
      setRejoinLoading(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Body scroll lock (modal overlay only) ──────────────────────────────────
  useEffect(() => {
    if (standalone || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, standalone]);

  // ── ESC handler ─────────────────────────────────────────────────────────────
  // In edit mode: delegate to cancel handler (dirty check inside).
  // In view mode: close modal as before.
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditing;

  useEffect(() => {
    if (!open && !standalone) return;
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
  }, [open, standalone, onClose, leaveConfirmOpen, deleteConfirmOpen, rateSheetOpen, discardConfirmOpen]);

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

  // ── Shared panel content (header + scroll body + footer) ────────────────────
  const panelContent = (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <EventModalHeader
        item={localItem}
        lifecycle={lifecycle}
        relationship={relationship}
        accent={accent}
        onClose={isEditing ? handleCancelEdit : onClose}
        onShare={handleShare}
        canSeeLocation={canSeeLocation}
        description={description}
        isEditing={isEditing}
      />

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          {isEditing ? (
            isJam ? (
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
              <ShowInlineEditForm
                key="edit-form"
                form={editForm}
                setForm={setEditForm}
                errors={editErrors}
                setErrors={setEditErrors}
                touched={editTouched}
                setTouched={setEditTouched}
                options={options}
              />
            )
          ) : (
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
                <ParticipationConfirmation
                  item={localItem}
                  accent={accent}
                  chatLeftAt={chatLeftAt}
                  onRejoinChat={handleRejoinChat}
                  rejoinLoading={rejoinLoading}
                  canRejoin={lifecycle === "upcoming" || lifecycle === "live"}
                />
              )}

              {!isShortDesc && (
                <EventDescriptionSection description={description} />
              )}

              <EventTagsSection item={localItem} accent={accent} />

              {(isJam || isShow) && (
                <JamFriendsPreview
                  item={localItem}
                  currentUserId={user?.id}
                  accent={accent}
                  onOpen={() => setAttendeesOpen(true)}
                  getAttendees={isShow ? showService.getShowAttendees : undefined}
                />
              )}

              {localItem.type === "jam" && ctx.isPastEvent && ratingSummary.rating_count > 0 && (
                <div className="px-7 pt-1 pb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: hexToRgba(accent, 0.12), color: accent }}
                  >
                    <span style={{ fontSize: 13 }}>★</span>
                    {ratingSummary.avg_rating}
                    <span className="font-normal opacity-60">
                      · {ratingSummary.rating_count} {ratingSummary.rating_count === 1 ? 'rating' : 'ratings'}
                    </span>
                  </span>
                </div>
              )}
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
                      onOpenAttendees={() => setAttendeesOpen(true)}
                    />
                  </>
                )}

                {/* Attendee-facing attendees entry point */}
                {(isJam || isShow) && !isCreatorOrAdmin && (
                  <>
                    <Divider />
                    <div className="px-3 pb-3">
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
                            Attendees
                          </p>
                        </div>
                        <button
                          onClick={() => setAttendeesOpen(true)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-white/[0.06] text-left"
                          style={{ color: "rgba(229,226,225,0.65)" }}
                        >
                          <span className="shrink-0 opacity-70">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </span>
                          See Who's Going
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <EventSafetyActions item={localItem} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {isEditing ? (
        <div
          className="px-7 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {saveError && (
            <p className="text-xs text-center mb-2" style={{ color: "#fb4040" }}>
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
                background: isSaving ? "rgba(255,255,255,0.08)" : accent,
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
          onRate={handleOpenRateSheet}
        />
      )}
    </>
  );

  // ── Shared confirm/rate sheets (fixed-positioned, work in both modes) ────────
  const sheets = (
    <>
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
      <ManageAttendeesModal
        open={attendeesOpen}
        onClose={() => setAttendeesOpen(false)}
        item={localItem}
        accent={accent}
        currentUserId={user?.id}
        isAdminMode={isCreatorOrAdmin}
      />
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
  );

  // ── Standalone mode: panel in page flow, no overlay ──────────────────────────
  if (standalone) {
    return (
      <>
        <div className="flex justify-center p-4 py-8">
          <div
            role="main"
            className="w-full max-w-[600px] flex flex-col bg-neutral-900 border border-white/10 rounded-[28px] overflow-hidden"
            style={{ boxShadow: `0 0 80px rgba(0,0,0,0.9), 0 0 48px ${hexToRgba(accent, 0.12)}` }}
          >
            {panelContent}
          </div>
        </div>
        {sheets}
      </>
    );
  }

  // ── Overlay mode: animated backdrop + centered fixed panel ───────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
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

          {/* Centering wrapper */}
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
              className="w-full max-w-[600px] flex flex-col bg-neutral-900 border border-white/10 rounded-[28px] overflow-hidden pointer-events-auto max-h-[90dvh] landscape:max-h-[80dvh]"
              style={{
                boxShadow: `0 0 80px rgba(0,0,0,0.9), 0 0 48px ${hexToRgba(accent, 0.12)}`,
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {panelContent}
            </motion.div>
          </div>

          {sheets}
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailModal;
