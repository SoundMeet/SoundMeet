/**
 * JamFriendsPreview — compact social-proof section inside the Jam modal.
 * Shows which friends are going (or total attendee count if no friends).
 * Clicking opens the attendees modal.
 *
 * Self-fetching: mounts a parallel fetch of attendees + friends and
 * renders nothing while loading or when there are no attendees yet.
 */

import { useState, useEffect } from "react";
import { jamService } from "../../injectables/jamService";
import { socialService } from "../../injectables/socialService";
import { formatAvatarUrl } from "../../utils/formatAvatarUrl";
import { nameToInitials } from "../../utils/eventComputed";
import { hexToRgba } from "../../utils/discovery";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Stacked avatar ───────────────────────────────────────────────────────────

const StackedAvatar = ({ name, pfp, accent, zIndex }) => {
  const url      = formatAvatarUrl(pfp);
  const initials = nameToInitials(name);
  const size     = 26;
  const border   = "2px solid rgba(15,15,15,0.95)";

  return url ? (
    <img
      src={url}
      alt={name}
      className="object-cover rounded-lg shrink-0"
      style={{ width: size, height: size, border, zIndex }}
    />
  ) : (
    <div
      className="rounded-lg flex items-center justify-center text-[9px] font-bold select-none shrink-0"
      style={{ width: size, height: size, border, background: hexToRgba(accent, 0.2), color: accent, zIndex }}
    >
      {initials}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const MAX_AVATARS = 3;

export function JamFriendsPreview({ item, currentUserId, accent, onOpen, getAttendees }) {
  const [data, setData] = useState(null); // null = loading, object = resolved

  useEffect(() => {
    if (!item?.id) return;
    let cancelled = false;

    const fetchAttendees = getAttendees ?? ((id) => jamService.getJamAttendees(id));
    const friendsPromise = currentUserId
      ? socialService.getMyFriends(currentUserId)
      : Promise.resolve([]);

    Promise.all([
      fetchAttendees(item.id),
      friendsPromise,
    ])
      .then(([attendees, myFriends]) => {
        if (cancelled) return;
        const friendIdSet     = new Set(myFriends.map((f) => String(f.id)));
        const friendAttendees = attendees.filter(
          (a) => String(a.userId) !== String(currentUserId) && friendIdSet.has(String(a.userId))
        );
        setData({ total: attendees.length, friends: friendAttendees });
      })
      .catch(() => {
        if (!cancelled) setData({ total: 0, friends: [] });
      });

    return () => { cancelled = true; };
  }, [item?.id, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading or empty roster → don't occupy space
  if (!data || data.total === 0) return null;

  const { total, friends } = data;
  const hasFriends  = friends.length > 0;
  const shown       = friends.slice(0, MAX_AVATARS);
  const extra       = friends.length > MAX_AVATARS ? friends.length - MAX_AVATARS : 0;

  // Human-readable subtitle
  let subtitle = "";
  if (!hasFriends) {
    subtitle = `${total} ${total === 1 ? "person" : "people"} going`;
  } else if (friends.length === 1) {
    subtitle = `${friends[0].displayName} is going`;
  } else if (friends.length === 2) {
    subtitle = `${friends[0].displayName} and ${friends[1].displayName} are going`;
  } else {
    const rest = friends.length - 1;
    subtitle = `${friends[0].displayName} and ${rest} more friend${rest > 1 ? "s" : ""} are going`;
  }

  const label = hasFriends ? "Friends Going" : "Who's Going";
  const bg    = hasFriends ? hexToRgba(accent, 0.05) : "rgba(255,255,255,0.025)";
  const bdry  = hasFriends ? hexToRgba(accent, 0.12) : "rgba(255,255,255,0.06)";
  const labelColor  = hasFriends ? hexToRgba(accent, 0.65) : "rgba(229,226,225,0.25)";
  const subtitleColor = hasFriends ? "rgba(229,226,225,0.75)" : "rgba(229,226,225,0.4)";

  return (
    <div className="px-7 pb-4">
      <button onClick={onOpen} className="w-full text-left group">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-150"
          style={{ background: bg, border: `1px solid ${bdry}` }}
        >
          {/* Avatar stack — only when friends are going */}
          {hasFriends && (
            <div className="flex shrink-0">
              {shown.map((f, i) => (
                <div key={f.userId} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                  <StackedAvatar
                    name={f.displayName}
                    pfp={f.pfp}
                    accent={accent}
                    zIndex={MAX_AVATARS - i}
                  />
                </div>
              ))}
              {extra > 0 && (
                <div
                  className="rounded-lg flex items-center justify-center text-[9px] font-bold select-none shrink-0"
                  style={{
                    width: 26, height: 26,
                    marginLeft: -8,
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(229,226,225,0.45)",
                    border: "2px solid rgba(15,15,15,0.95)",
                    zIndex: 0,
                  }}
                >
                  +{extra}
                </div>
              )}
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: labelColor }}
            >
              {label}
            </p>
            <p
              className="text-[12px] font-medium leading-snug truncate"
              style={{ color: subtitleColor }}
            >
              {subtitle}
            </p>
          </div>

          {/* Chevron */}
          <span className="shrink-0 transition-opacity duration-150 opacity-30 group-hover:opacity-60" style={{ color: "rgba(229,226,225,1)" }}>
            <ChevronRight />
          </span>
        </div>
      </button>
    </div>
  );
}
