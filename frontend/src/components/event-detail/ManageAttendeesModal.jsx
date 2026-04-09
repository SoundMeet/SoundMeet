/**
 * ManageAttendeesModal — shows the creator a list of jam attendees
 * with their profile info and (stubbed) gear they're bringing.
 *
 * Sits at z-[65], above EventDetailModal (z-50) and below
 * DestructiveConfirmSheet (z-[70]).
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jamService } from "../../injectables/jamService";
import { formatAvatarUrl } from "../../utils/formatAvatarUrl";
import { hexToRgba } from "../../utils/discovery";
import { nameToInitials } from "../../utils/eventComputed";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const PackageIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// ─── Avatar block ─────────────────────────────────────────────────────────────

const AttendeeAvatar = ({ name, pfp, accent, isHost }) => {
  const initials = nameToInitials(name);
  const avatarUrl = formatAvatarUrl(pfp);

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="h-9 w-9 rounded-xl object-cover shrink-0"
      style={{ border: `1px solid ${hexToRgba(accent, 0.2)}` }}
    />
  ) : (
    <div
      className="h-9 w-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 select-none"
      style={{
        background: isHost ? hexToRgba(accent, 0.18) : "rgba(255,255,255,0.06)",
        color: isHost ? accent : "rgba(229,226,225,0.5)",
        border: `1px solid ${isHost ? hexToRgba(accent, 0.25) : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {initials}
    </div>
  );
};

// ─── Single attendee row ──────────────────────────────────────────────────────

const AttendeeRow = ({ attendee, adminId, accent }) => {
  const isHost = String(attendee.userId) === String(adminId);
  const hasGear = attendee.gearBringing?.length > 0;

  return (
    <div className="flex items-start gap-3 py-3">
      <AttendeeAvatar
        name={attendee.displayName}
        pfp={attendee.pfp}
        accent={accent}
        isHost={isHost}
      />

      <div className="flex-1 min-w-0">
        {/* Name + Host badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white truncate">
            {attendee.displayName}
          </span>
          {isHost && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
              style={{
                color: accent,
                background: hexToRgba(accent, 0.14),
                border: `1px solid ${hexToRgba(accent, 0.22)}`,
              }}
            >
              Host
            </span>
          )}
        </div>

        {/* Gear bringing */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PackageIcon
            style={{ color: "rgba(229,226,225,0.2)", flexShrink: 0 }}
          />
          {hasGear ? (
            attendee.gearBringing.map((g) => (
              <span
                key={g}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(229,226,225,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {g}
              </span>
            ))
          ) : (
            <span
              className="text-[11px] italic"
              style={{ color: "rgba(229,226,225,0.22)" }}
            >
              Nothing listed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ManageAttendeesModal ─────────────────────────────────────────────────────

/**
 * Props:
 *   open      {boolean}
 *   onClose   {() => void}
 *   item      {Object}   normalized jam item (needs item.id, item.admin_id, item.title)
 *   accent    {string}   hex accent color
 */
export function ManageAttendeesModal({ open, onClose, item, accent }) {
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  // Fetch when opened
  useEffect(() => {
    if (!open || !item?.id) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    jamService
      .getJamAttendees(item.id)
      .then((list) => {
        if (cancelled) return;
        // Host first, then alphabetical
        const sorted = [...list].sort((a, b) => {
          const aHost = String(a.userId) === String(item.admin_id);
          const bHost = String(b.userId) === String(item.admin_id);
          if (aHost && !bHost) return -1;
          if (!aHost && bHost) return 1;
          return a.displayName.localeCompare(b.displayName);
        });
        setAttendees(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[ManageAttendeesModal] fetch failed:", err);
        setError("Couldn't load attendees. Try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="attendees-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="attendees-panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-[440px] flex flex-col bg-neutral-900 border border-white/10 rounded-[24px] overflow-hidden pointer-events-auto"
              style={{
                maxHeight: "70vh",
                boxShadow: `0 0 60px rgba(0,0,0,0.85), 0 0 32px ${hexToRgba(accent, 0.1)}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 flex items-center justify-center rounded-lg"
                    style={{
                      background: hexToRgba(accent, 0.14),
                      color: accent,
                    }}
                  >
                    <UserIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      Attendees
                    </p>
                    {!isLoading && !error && (
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: "rgba(229,226,225,0.35)" }}
                      >
                        {attendees.length}{" "}
                        {attendees.length === 1 ? "person" : "people"} going
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="h-7 w-7 flex items-center justify-center rounded-full transition-colors duration-150"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(229,226,225,0.5)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(229,226,225,0.5)"; }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Body */}
              <div
                className="flex-1 overflow-y-auto px-5"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center py-10">
                    <span
                      className="text-sm"
                      style={{ color: "rgba(229,226,225,0.3)" }}
                    >
                      Loading…
                    </span>
                  </div>
                )}

                {/* Error */}
                {!isLoading && error && (
                  <div className="flex items-center justify-center py-10">
                    <span className="text-sm" style={{ color: "#fb4040" }}>
                      {error}
                    </span>
                  </div>
                )}

                {/* Empty */}
                {!isLoading && !error && attendees.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <span
                      className="text-sm"
                      style={{ color: "rgba(229,226,225,0.28)" }}
                    >
                      No attendees yet
                    </span>
                  </div>
                )}

                {/* List */}
                {!isLoading && !error && attendees.length > 0 && (
                  <div
                    className="divide-y"
                    style={{ "--tw-divide-opacity": 1 }}
                  >
                    {attendees.map((attendee, i) => (
                      <div
                        key={attendee.userId}
                        style={{
                          borderTopColor:
                            i === 0
                              ? "transparent"
                              : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <AttendeeRow
                          attendee={attendee}
                          adminId={item.admin_id}
                          accent={accent}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Gear note — shown when there are attendees */}
                {!isLoading && !error && attendees.length > 0 && (
                  <p
                    className="text-[11px] text-center pb-4 pt-2"
                    style={{ color: "rgba(229,226,225,0.18)" }}
                  >
                    Gear info updates when attendees select what they're bringing
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
