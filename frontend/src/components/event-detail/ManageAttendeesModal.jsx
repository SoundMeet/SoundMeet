/**
 * ManageAttendeesModal — attendee management panel for jam creators.
 * Tabs: All · Friends · Coverage
 *
 * z-[65]: above EventDetailModal (z-50), below DestructiveConfirmSheet (z-[70]).
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { jamService } from "../../injectables/jamService";
import { showService } from "../../injectables/showService";
import { socialService } from "../../injectables/socialService";
import { formatAvatarUrl } from "../../utils/formatAvatarUrl";
import { hexToRgba } from "../../utils/discovery";
import { nameToInitials } from "../../utils/eventComputed";
import { ProfilesRUS } from "../../services/ProfilesRUS";
import { useFriends } from "../../context/FriendsContext";

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

const RemoveIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

const AddFriendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

// ─── Shared primitives ────────────────────────────────────────────────────────

const Badge = ({ children, color, bg, border }) => (
  <span
    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none shrink-0"
    style={{ color, background: bg, border: `1px solid ${border}` }}
  >
    {children}
  </span>
);

const Chip = ({ children }) => (
  <span
    className="text-[11px] px-2 py-0.5 rounded-full leading-snug"
    style={{
      background: "rgba(255,255,255,0.06)",
      color: "rgba(229,226,225,0.6)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {children}
  </span>
);

const SectionLabel = ({ children }) => (
  <p
    className="text-[9px] font-semibold uppercase tracking-[0.14em] mb-1.5"
    style={{ color: "rgba(229,226,225,0.28)" }}
  >
    {children}
  </p>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AttendeeAvatar = ({ name, pfp, accent, isHost }) => {
  const avatarUrl = formatAvatarUrl(pfp);
  const initials  = nameToInitials(name);

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="h-10 w-10 rounded-xl object-cover shrink-0"
      style={{ border: `1px solid ${hexToRgba(accent, 0.18)}` }}
    />
  ) : (
    <div
      className="h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 select-none"
      style={{
        background: isHost ? hexToRgba(accent, 0.16) : "rgba(255,255,255,0.06)",
        color:      isHost ? accent : "rgba(229,226,225,0.45)",
        border:     `1px solid ${isHost ? hexToRgba(accent, 0.22) : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {initials}
    </div>
  );
};

// ─── Coverage tab ─────────────────────────────────────────────────────────────

// Maps the attendee state field name to the service parameter name
const SERVICE_FIELD_MAP = {
  instrumentsBringing: "instruments",
  rolesBringing:       "roles",
  gearBringing:        "gear",
};

const NeedsTab = ({ item, attendees, currentUserId, onToggleBringing, togglingItem, isAdminMode }) => {
  const isHost     = String(currentUserId) === String(item?.admin_id);
  const myAttendee = !isHost ? attendees.find((a) => String(a.userId) === String(currentUserId)) : null;

  const buildMap = (field) => {
    const map = {};
    attendees.forEach((a) => {
      (a[field] ?? []).forEach((name) => {
        const key = name.toLowerCase();
        if (!map[key]) map[key] = { label: name, contributors: [] };
        map[key].contributors.push(a.displayName);
      });
    });
    return map;
  };

  const instrumentMap = buildMap("instrumentsBringing");
  const roleMap       = buildMap("rolesBringing");
  const gearMap       = buildMap("gearBringing");

  const sections = [
    { key: "instruments", label: "Instruments", needs: item.instrumentsNeeded ?? [], map: instrumentMap, field: "instrumentsBringing" },
    { key: "roles",       label: "Roles",       needs: item.rolesNeeded       ?? [], map: roleMap,       field: "rolesBringing"       },
    { key: "gear",        label: "Gear needed", needs: item.gearNeededItems   ?? [], map: gearMap,       field: "gearBringing"        },
  ].filter((s) => s.needs.length > 0);

  const totalNeeded  = sections.reduce((n, s) => n + s.needs.length, 0);
  const totalCovered = sections.reduce((n, s) =>
    n + s.needs.filter((need) => s.map[need.toLowerCase()]).length, 0
  );
  const allCovered = totalNeeded > 0 && totalCovered === totalNeeded;
  const pct = totalNeeded > 0 ? Math.round((totalCovered / totalNeeded) * 100) : 0;

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2.5">
        <span style={{ color: "rgba(229,226,225,0.18)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-white">No requirements set</span>
        <span className="text-[11px] text-center leading-relaxed" style={{ color: "rgba(229,226,225,0.3)" }}>
          Edit the jam to specify what instruments,<br />roles, or gear you need from attendees
        </span>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5">
      {/* Summary block */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{
          background: allCovered ? "rgba(74,222,128,0.06)" : "rgba(251,180,64,0.05)",
          border: `1px solid ${allCovered ? "rgba(74,222,128,0.14)" : "rgba(251,180,64,0.12)"}`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[13px] font-bold" style={{ color: allCovered ? "#4ade80" : "#fbb440" }}>
              {allCovered ? "All needs covered" : `${totalCovered} of ${totalNeeded} covered`}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(229,226,225,0.35)" }}>
              {totalNeeded - totalCovered === 0
                ? "Everything is sorted"
                : `${totalNeeded - totalCovered} item${totalNeeded - totalCovered > 1 ? "s" : ""} still needed`}
            </p>
          </div>
          <span
            className="text-[22px] font-bold tabular-nums leading-none"
            style={{ color: allCovered ? "#4ade80" : "#fbb440" }}
          >
            {pct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: allCovered ? "#4ade80" : "#fbb440",
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.key}>
          <SectionLabel>{section.label}</SectionLabel>
          <div className="space-y-1.5">
            {section.needs.map((need) => {
              const match      = section.map[need.toLowerCase()];
              const covered    = !!match;
              const toggleKey  = `${section.field}:${need}`;
              const isToggling = togglingItem === toggleKey;
              const amBringing = myAttendee
                ? (myAttendee[section.field] ?? []).some((x) => x.toLowerCase() === need.toLowerCase())
                : false;

              return (
                <div
                  key={need}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                  style={{
                    background: covered ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.025)",
                    border: `1px solid ${covered ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.055)"}`,
                  }}
                >
                  {/* Status icon */}
                  <span
                    className="shrink-0 flex"
                    style={{ color: covered ? "#4ade80" : "rgba(251,180,64,0.65)" }}
                  >
                    {covered ? <CheckIcon /> : <AlertIcon />}
                  </span>

                  {/* Need name + contributors */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-tight">{need}</p>
                    <p
                      className="text-[10px] mt-0.5 leading-relaxed truncate"
                      style={{ color: covered ? "rgba(229,226,225,0.38)" : "rgba(229,226,225,0.22)" }}
                    >
                      {covered ? match.contributors.join(", ") : "Nobody bringing this yet"}
                    </p>
                  </div>

                  {/* Action button — only for non-host attendees */}
                  {myAttendee && (
                    <div className="shrink-0">
                      {amBringing ? (
                        <button
                          onClick={() => onToggleBringing(section.field, need)}
                          disabled={isToggling}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 disabled:opacity-40"
                          style={{
                            background: "rgba(74,222,128,0.12)",
                            color: "#4ade80",
                            border: "1px solid rgba(74,222,128,0.22)",
                          }}
                        >
                          {isToggling ? "…" : (<>Bringing <span style={{ opacity: 0.65, lineHeight: 1 }}>×</span></>)}
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleBringing(section.field, need)}
                          disabled={isToggling}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 disabled:opacity-40"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(229,226,225,0.45)",
                            border: "1px solid rgba(255,255,255,0.09)",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(229,226,225,0.45)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        >
                          {isToggling ? "…" : "+ Bring"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Joined attendee hint */}
      {myAttendee && (
        <p className="text-[10px] text-center pb-1" style={{ color: "rgba(229,226,225,0.15)" }}>
          Tap an item to commit or uncommit what you're bringing
        </p>
      )}

      {/* Pre-join viewer prompt */}
      {!isAdminMode && !myAttendee && (
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mt-1"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="shrink-0" style={{ color: "rgba(229,226,225,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white leading-tight">Join to contribute</p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "rgba(229,226,225,0.3)" }}>
              Once you join this jam, you can commit what you're bringing
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Attendee row ─────────────────────────────────────────────────────────────

const AVATAR_W = 40; // px — used to inset confirm + dividers

const AttendeeRow = ({
  attendee, adminId, accent,
  isFriend, isYou, isAdminMode, isShow,
  onRemove, isRemoving, confirmingRemove, onConfirmRemove, onCancelRemove,
  requestSent, onAddFriend, onCancelRequest, onOpenProfile,
}) => {
  const [hoveringRequest, setHoveringRequest] = useState(false);
  const isHost    = String(attendee.userId) === String(adminId);
  const canRemove = !isHost && !isYou && isAdminMode;

  // Compact identity line: "Electric Guitar · Lead Guitarist"
  const identityParts = isHost ? [] : [
    ...(attendee.instrumentsBringing ?? []),
    ...(attendee.rolesBringing       ?? []),
  ];
  const identityLine = identityParts.join(" · ");

  const gear      = attendee.gearBringing ?? [];
  const hasGear   = gear.length > 0;
  const hasAny    = identityParts.length > 0 || hasGear;

  return (
    <div className="py-4">
      {/* 3-zone row: avatar | content | action */}
      <div className="flex items-start gap-3">

        {/* Zone 1 — avatar (clickable to profile) */}
        <button
          onClick={() => onOpenProfile?.()}
          className="flex-shrink-0 transition-opacity hover:opacity-75 active:opacity-60"
          style={{ background: "none", border: "none", padding: 0, cursor: onOpenProfile ? "pointer" : "default" }}
          aria-label={`View ${attendee.displayName}'s profile`}
        >
          <AttendeeAvatar
            name={attendee.displayName}
            pfp={attendee.pfp}
            accent={accent}
            isHost={isHost}
          />
        </button>

        {/* Zone 2 — content */}
        <div className="flex-1 min-w-0">

          {/* Name + status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onOpenProfile?.()}
              className="text-[13px] font-semibold text-white leading-tight transition-opacity hover:opacity-75"
              style={{ background: "none", border: "none", padding: 0, cursor: onOpenProfile ? "pointer" : "default" }}
            >
              {attendee.displayName}
            </button>
            {isHost && (
              <Badge color={accent} bg={hexToRgba(accent, 0.13)} border={hexToRgba(accent, 0.2)}>
                Host
              </Badge>
            )}
            {isYou && (
              <Badge color="rgba(229,226,225,0.55)" bg="rgba(255,255,255,0.07)" border="rgba(255,255,255,0.1)">
                You
              </Badge>
            )}
            {isFriend && !isHost && !isYou && (
              <Badge color="#4ade80" bg="rgba(74,222,128,0.1)" border="rgba(74,222,128,0.18)">
                Friend
              </Badge>
            )}
          </div>

          {/* Identity line */}
          {identityLine && (
            <p
              className="text-[11px] mt-1 leading-snug truncate"
              style={{ color: "rgba(229,226,225,0.38)" }}
            >
              {identityLine}
            </p>
          )}

          {/* Nothing at all — suppress for shows since they don't track gear/roles */}
          {!hasAny && !isShow && (
            <p className="text-[11px] mt-1 italic" style={{ color: "rgba(229,226,225,0.2)" }}>
              Nothing listed
            </p>
          )}

          {/* Gear / available contribution section */}
          {hasGear && (
            <div className="mt-3">
              <SectionLabel>{isHost ? "Available at jam" : "Bringing"}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {gear.map((g) => <Chip key={g}>{g}</Chip>)}
              </div>
            </div>
          )}
        </div>

        {/* Zone 3 — action rail */}
        <div className="shrink-0 flex items-center gap-1.5 self-center">
          {!isYou && !isFriend && (
            requestSent ? (
              <button
                onClick={onCancelRequest}
                aria-label="Cancel friend request"
                className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
                style={{
                  background: hoveringRequest ? "rgba(251,64,64,0.12)" : "rgba(255,255,255,0.05)",
                  color: hoveringRequest ? "rgba(251,64,64,0.7)" : "rgba(229,226,225,0.22)",
                  border: hoveringRequest ? "1px solid rgba(251,64,64,0.18)" : "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={() => setHoveringRequest(true)}
                onMouseLeave={() => setHoveringRequest(false)}
              >
                {hoveringRequest ? <RemoveIcon /> : <AddFriendIcon />}
              </button>
            ) : (
              <button
                onClick={onAddFriend}
                aria-label={`Add ${attendee.displayName} as friend`}
                className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
                style={{
                  background: hexToRgba(accent, 0.1),
                  color: accent,
                  border: `1px solid ${hexToRgba(accent, 0.2)}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = hexToRgba(accent, 0.2); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = hexToRgba(accent, 0.1); }}
              >
                <AddFriendIcon />
              </button>
            )
          )}
          {canRemove && !confirmingRemove && (
            <button
              onClick={onRemove}
              disabled={isRemoving}
              aria-label={`Remove ${attendee.displayName}`}
              className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-40"
              style={{ background: "rgba(251,64,64,0.08)", color: "rgba(251,64,64,0.45)", border: "1px solid rgba(251,64,64,0.1)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(251,64,64,0.16)"; e.currentTarget.style.color = "#fb4040"; e.currentTarget.style.border = "1px solid rgba(251,64,64,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(251,64,64,0.08)"; e.currentTarget.style.color = "rgba(251,64,64,0.45)"; e.currentTarget.style.border = "1px solid rgba(251,64,64,0.1)"; }}
            >
              <RemoveIcon />
            </button>
          )}
        </div>
      </div>

      {/* Inline confirm — inset to content zone */}
      {confirmingRemove && (
        <div
          className="mt-2.5 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl"
          style={{
            marginLeft: AVATAR_W + 12, // avatar width + gap
            background: "rgba(251,64,64,0.06)",
            border: "1px solid rgba(251,64,64,0.13)",
          }}
        >
          <span className="text-[11px] leading-snug" style={{ color: "rgba(229,226,225,0.55)" }}>
            Remove <span className="font-semibold text-white">{attendee.displayName}</span>?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCancelRemove}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors duration-150"
              style={{ color: "rgba(229,226,225,0.45)", background: "rgba(255,255,255,0.06)" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirmRemove}
              disabled={isRemoving}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors duration-150 disabled:opacity-50"
              style={{ color: "#fff", background: "rgba(251,64,64,0.72)" }}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ManageAttendeesModal({ open, onClose, item, accent, currentUserId, isAdminMode = true }) {
  const navigate = useNavigate();
  const { sendFriendRequest: sendFriendRequestViaContext, cancelSentRequest: cancelSentRequestViaContext, sentRequests: contextSentRequests } = useFriends();
  const isShow = item?.type === "promote_show";
  const [attendees,       setAttendees]       = useState([]);
  const [friendIds,       setFriendIds]       = useState(new Set());
  const [activeTab,       setActiveTab]       = useState("all");
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [removingId,      setRemovingId]      = useState(null);
  const [togglingItem,    setTogglingItem]    = useState(null);
  // Map<userId, requestId> — stores sent request IDs so we can cancel them
  const [sentRequests,    setSentRequests]    = useState(new Map());

  // Fetch attendees + friends in parallel
  useEffect(() => {
    if (!open || !item?.id) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const isShow = item.type === "promote_show";
    Promise.all([
      isShow ? showService.getShowAttendees(item.id) : jamService.getJamAttendees(item.id),
      currentUserId ? socialService.getMyFriends(currentUserId) : Promise.resolve([]),
    ])
      .then(([list, friends]) => {
        if (cancelled) return;
        setFriendIds(new Set(friends.map((f) => String(f.id))));
        const normalized = list.map((a) =>
          String(a.userId) === String(item.admin_id)
            ? { ...a, gearBringing: item.gearProvidedItems ?? [] }
            : a
        );
        setAttendees(
          [...normalized].sort((a, b) => {
            const aH = String(a.userId) === String(item.admin_id);
            const bH = String(b.userId) === String(item.admin_id);
            if (aH && !bH) return -1;
            if (!aH && bH) return 1;
            return a.displayName.localeCompare(b.displayName);
          })
        );
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[ManageAttendeesModal] fetch failed:", err);
          setError("Couldn't load attendees. Try again.");
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!open) { setActiveTab("all"); setConfirmRemoveId(null); setRemovingId(null); setSentRequests(new Map()); }
  }, [open]);

  const handleAddFriend = async (userId) => {
    setSentRequests((prev) => new Map(prev).set(String(userId), null));
    try {
      await sendFriendRequestViaContext(userId);
      setSentRequests((prev) => new Map(prev).set(String(userId), 'sent'));
    } catch (err) {
      console.error("[ManageAttendeesModal] add friend failed:", err);
      setSentRequests((prev) => { const m = new Map(prev); m.delete(String(userId)); return m; });
    }
  };

  const handleCancelRequest = async (userId) => {
    const ctxReq = contextSentRequests.find((r) => String(r.toUser?.id) === String(userId));
    const requestId = ctxReq?.id;
    setSentRequests((prev) => { const m = new Map(prev); m.delete(String(userId)); return m; });
    try {
      if (requestId) await cancelSentRequestViaContext(requestId);
    } catch (err) {
      console.error("[ManageAttendeesModal] cancel request failed:", err);
      setSentRequests((prev) => new Map(prev).set(String(userId), requestId));
    }
  };

  // ESC
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  const handleToggleBringing = async (field, itemName) => {
    const myEntry = attendees.find((a) => String(a.userId) === String(currentUserId));
    if (!myEntry) return;

    const current    = myEntry[field] ?? [];
    const amBringing = current.some((x) => x.toLowerCase() === itemName.toLowerCase());
    const next       = amBringing
      ? current.filter((x) => x.toLowerCase() !== itemName.toLowerCase())
      : [...current, itemName];

    const toggleKey = `${field}:${itemName}`;
    const snapshot  = attendees;

    // Optimistic update
    setAttendees((prev) =>
      prev.map((a) =>
        String(a.userId) === String(currentUserId) ? { ...a, [field]: next } : a
      )
    );
    setTogglingItem(toggleKey);

    try {
      await jamService.updateMyBringing(item.id, currentUserId, {
        [SERVICE_FIELD_MAP[field]]: next,
      });
    } catch (err) {
      console.error("[ManageAttendeesModal] toggle bringing failed:", err);
      setAttendees(snapshot); // rollback
    } finally {
      setTogglingItem(null);
    }
  };

  const handleConfirmRemove = async (userId) => {
    setRemovingId(userId);
    try {
      await (isShow
        ? showService.removeShowAttendee(item.id, userId)
        : jamService.removeAttendee(item.id, userId));
      setAttendees((prev) => prev.filter((a) => a.userId !== userId));
      setConfirmRemoveId(null);
    } catch (err) {
      console.error("[ManageAttendeesModal] remove failed:", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Derived
  const friendsTabList = attendees
    .filter((a) => String(a.userId) === String(currentUserId) || friendIds.has(String(a.userId)))
    .sort((a, b) => {
      if (String(a.userId) === String(currentUserId)) return -1;
      if (String(b.userId) === String(currentUserId)) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

  const visibleAttendees    = activeTab === "friends" ? friendsTabList : attendees;
  const friendAttendeeCount = attendees.filter(
    (a) => String(a.userId) !== String(currentUserId) && friendIds.has(String(a.userId))
  ).length;

  const TABS = [
    { id: "all",      label: "All",      count: attendees.length,    color: accent    },
    { id: "friends",  label: "Friends",  count: friendAttendeeCount, color: "#4ade80" },
    ...(!isShow ? [{ id: "coverage", label: "Coverage", count: null, color: "#fbb440" }] : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="attendees-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="attendees-panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95,  y: 8  }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-[460px] flex flex-col bg-neutral-900 border border-white/10 rounded-[24px] overflow-hidden pointer-events-auto"
              style={{
                maxHeight: "72vh",
                boxShadow: `0 0 60px rgba(0,0,0,0.85), 0 0 32px ${hexToRgba(accent, 0.1)}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 flex items-center justify-center rounded-lg shrink-0"
                    style={{ background: hexToRgba(accent, 0.14), color: accent }}
                  >
                    <UserIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Attendees</p>
                    {!isLoading && !error && (
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(229,226,225,0.32)" }}>
                        {attendees.length} {attendees.length === 1 ? "person" : "people"} going
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-colors duration-150"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(229,226,225,0.5)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(229,226,225,0.5)"; }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* ── Tabs ── */}
              {!isLoading && !error && attendees.length > 0 && (
                <div
                  className="flex gap-0.5 px-4 pt-2.5 pb-2 shrink-0"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
                        style={{
                          background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
                          color: isActive ? "#fff" : "rgba(229,226,225,0.35)",
                        }}
                      >
                        {tab.label}
                        {tab.count !== null && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums"
                            style={{
                              background: isActive ? `${tab.color}28` : "rgba(255,255,255,0.05)",
                              color: isActive ? tab.color : "rgba(229,226,225,0.28)",
                            }}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Body ── */}
              <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "none" }}>

                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <span className="text-sm" style={{ color: "rgba(229,226,225,0.28)" }}>Loading…</span>
                  </div>
                )}

                {!isLoading && error && (
                  <div className="flex items-center justify-center py-12">
                    <span className="text-sm" style={{ color: "#fb4040" }}>{error}</span>
                  </div>
                )}

                {!isLoading && !error && attendees.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-1.5">
                    <span className="text-sm font-medium" style={{ color: "rgba(229,226,225,0.28)" }}>No attendees yet</span>
                  </div>
                )}

                {/* Coverage tab */}
                {!isLoading && !error && activeTab === "coverage" && (
                  <NeedsTab
                    item={item}
                    attendees={attendees}
                    currentUserId={currentUserId}
                    onToggleBringing={handleToggleBringing}
                    togglingItem={togglingItem}
                    isAdminMode={isAdminMode}
                  />
                )}

                {/* Friends empty state */}
                {!isLoading && !error && activeTab === "friends" && visibleAttendees.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <span style={{ color: "rgba(229,226,225,0.18)" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-white">No friends here yet</span>
                    <span className="text-[11px] text-center" style={{ color: "rgba(229,226,225,0.28)" }}>
                      {isShow ? "Share the show — your crew might come" : "Share the jam — your crew might join"}
                    </span>
                  </div>
                )}

                {/* Attendee list */}
                {!isLoading && !error && activeTab !== "coverage" && visibleAttendees.length > 0 && (
                  <div>
                    {visibleAttendees.map((attendee, i) => {
                      const isYou = String(attendee.userId) === String(currentUserId);
                      return (
                        <div
                          key={attendee.userId}
                          style={{
                            borderBottom: i < visibleAttendees.length - 1
                              ? "1px solid rgba(255,255,255,0.05)"
                              : "none",
                          }}
                        >
                          <AttendeeRow
                            attendee={attendee}
                            adminId={item.admin_id}
                            accent={accent}
                            isFriend={friendIds.has(String(attendee.userId))}
                            isYou={isYou}
                            isAdminMode={isAdminMode}
                            isShow={isShow}
                            onRemove={() => setConfirmRemoveId(attendee.userId)}
                            isRemoving={removingId === attendee.userId}
                            confirmingRemove={confirmRemoveId === attendee.userId}
                            onConfirmRemove={() => handleConfirmRemove(attendee.userId)}
                            onCancelRemove={() => setConfirmRemoveId(null)}
                            requestSent={sentRequests.has(String(attendee.userId))}
                            onAddFriend={() => handleAddFriend(attendee.userId)}
                            onCancelRequest={() => handleCancelRequest(attendee.userId)}
                            onOpenProfile={attendee.profileId ? () => { onClose?.(); ProfilesRUS(navigate, attendee.profileId); } : undefined}
                          />
                        </div>
                      );
                    })}

                    {/* Inline helper — only relevant for jams where attendees declare gear */}
                    {!isShow && (
                      <p
                        className="text-[10px] text-center pt-1 pb-4"
                        style={{ color: "rgba(229,226,225,0.15)" }}
                      >
                        Gear info updates when attendees select what they're bringing
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
