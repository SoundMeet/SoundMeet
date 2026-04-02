import { useEffect, useState } from "react";
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

import EventModalHeader from "./EventModalHeader";
import EventIdentitySection from "./EventIdentitySection";
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

import JamDetailSections from "./sections/JamDetailSections";
import ShowDetailSections from "./sections/ShowDetailSections";
import JoinBandDetailSections from "./sections/JoinBandDetailSections";
import FindBandmateDetailSections from "./sections/FindBandmateDetailSections";

/** Thin horizontal rule between sections */
const Divider = () => (
  <div className="mx-7 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
);

// ─── Default viewer context ───────────────────────────────────────────────────

const DEFAULT_VIEWER_CONTEXT = {
  isCreator: false,
  isAdmin: false,
  isAttendee: false,
  joinState: null,
  isPastEvent: false,
};

// ─── EventDetailModal ─────────────────────────────────────────────────────────

/**
 * EventDetailModal — single canonical event/jam detail modal used across the app.
 *
 * Replaces all fragmented detail modals. One modal to rule them all.
 *
 * Props:
 *   item           {Object}    Discovery item (jam, promote_show, join_band, find_bandmate)
 *   open           {boolean}
 *   onClose        {Function}  Called when modal should close
 *   viewerContext  {Object?}   Viewer relationship to the event
 *     isCreator    {boolean?}  Viewer created this event
 *     isAdmin      {boolean?}  Viewer is an admin for this event
 *     isAttendee   {boolean?}  Viewer has an approved spot
 *     joinState    {string?}   'pending' | 'approved' | 'waitlisted' | null
 *     isPastEvent  {boolean?}  True if rendered from a past-events context
 *   onJoin         {Function?} Called when viewer clicks primary join CTA
 *   onEdit         {Function?} Called when creator clicks Edit
 *   onDelete       {Function?} Called when creator confirms Cancel Event; receives item
 *   openedFrom     {string?}   'map' | 'discover' | 'my-jams' | 'chat' — hints only
 */
const EventDetailModal = ({
  item,
  open,
  onClose,
  viewerContext,
  onJoin,
  onEdit,
  onDelete,
  onRate,
  openedFrom,
}) => {
  const ctx = { ...DEFAULT_VIEWER_CONTEXT, ...viewerContext };
  const [rateSheetOpen, setRateSheetOpen] = useState(false);

  // ── Computed state ──────────────────────────────────────────────────────────
  const accent = getDiscoveryAccentColor(item);
  const lifecycle = getEventLifecycleState(item, ctx);
  const relationship = getUserEventRelationship(item, ctx);
  const canSeeLocation = canRevealExactLocation(item, ctx);
  const isCreatorOrAdmin = relationship === "creator" || relationship === "admin";

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── ESC to close ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!item) return null;

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
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Centering wrapper ─────────────────────────────────────────── */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={`edm-${item.id}`}
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
              {/* ── Header (accent bar + type badge + title + close) ────── */}
              <EventModalHeader
                item={item}
                lifecycle={lifecycle}
                relationship={relationship}
                accent={accent}
                onClose={onClose}
              />

              <Divider />

              {/* ── Scrollable body ───────────────────────────────────────── */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Identity: host, date, location */}
                <EventIdentitySection
                  item={item}
                  accent={accent}
                  canSeeLocation={canSeeLocation}
                />

                {/* Attendance: count, capacity bar, avatars */}
                <EventAttendanceSection item={item} accent={accent} />

                {/* Privacy notice: shown when location is hidden */}
                <EventPermissionsNotice item={item} viewerContext={ctx} />

                <Divider />

                {/* Description */}
                <EventDescriptionSection description={item.description ?? item.summary} />

                {/* Tags: genre + vibe + type pills */}
                <EventTagsSection item={item} accent={accent} />

                {/* Type-specific supplemental sections */}
                {item.type === "jam" && <JamDetailSections item={item} />}
                {item.type === "promote_show" && <ShowDetailSections item={item} />}
                {item.type === "join_band" && <JoinBandDetailSections item={item} />}
                {item.type === "find_bandmate" && <FindBandmateDetailSections item={item} />}

                <Divider />

                {/* Logistics: detailRows grid + gear/rules fields */}
                <EventLogisticsSection item={item} />

                <Divider />

                {/* Host/organizer identity */}
                <EventHostSection
                  item={item}
                  accent={accent}
                  relationship={relationship}
                />

                {/* Admin management actions — creator/admin only */}
                {isCreatorOrAdmin && (
                  <>
                    <Divider />
                    <EventAdminActions
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onClose={onClose}
                    />
                  </>
                )}

                {/* Safety: report, last updated */}
                <Divider />
                <EventSafetyActions item={item} />
              </div>

              {/* ── Sticky footer CTA ─────────────────────────────────────── */}
              <EventFooterActions
                item={item}
                lifecycle={lifecycle}
                relationship={relationship}
                accent={accent}
                onJoin={onJoin}
                onEdit={onEdit}
                onClose={onClose}
                onRate={() => setRateSheetOpen(true)}
              />
            </motion.div>
          </div>

          {/* Rate / review sheet — sits above the modal */}
          <RateJamSheet
            open={rateSheetOpen}
            onClose={() => setRateSheetOpen(false)}
            item={item}
            onSubmit={(rating, comment) => {
              onRate?.(item, rating, comment);
              setRateSheetOpen(false);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailModal;
