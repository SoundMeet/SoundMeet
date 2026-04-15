import { useState, useEffect } from "react";
import { hexToRgba } from "../../utils/discovery";
import { extractHostDisplay, nameToInitials } from "../../utils/eventComputed";
import { supabase } from "../../injectables/supaBaseClient";
import { formatAvatarUrl } from "../../utils/formatAvatarUrl";

// ─── IdentityRow ──────────────────────────────────────────────────────────────

/**
 * Compact identity row: avatar/initials block + primary name + subtle role label.
 * Used for both the Organizer row and the Venue row so they feel parallel.
 */
const IdentityRow = ({ name, roleLabel, accent, avatarUrl, icon: Icon }) => {
  const initials = nameToInitials(name);

  return (
    <div className="flex items-center gap-2.5">
      {/* Left block: real photo > icon > accent initials */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          className="h-7 w-7 rounded-lg object-cover shrink-0"
          style={{ border: `1px solid ${hexToRgba(accent, 0.2)}` }}
        />
      ) : Icon ? (
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          <Icon />
        </div>
      ) : (
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{
            background: hexToRgba(accent, 0.14),
            color: accent,
            border: `1px solid ${hexToRgba(accent, 0.2)}`,
          }}
        >
          {initials}
        </div>
      )}

      {/* Name + role */}
      <p className="text-sm text-neutral-300 truncate min-w-0">
        <span className="font-semibold text-white">{name}</span>
        <span className="ml-1.5 text-[11px] text-neutral-600 font-normal">{roleLabel}</span>
      </p>
    </div>
  );
};

// ─── EventHostSection ─────────────────────────────────────────────────────────

/**
 * EventHostSection — organizer/host identity block + venue (shows only).
 *
 * Jams and shows both fetch the creator profile from chat_profile via admin_id.
 * Shows additionally render a second Venue row from item.venueName / item.locationName.
 */
const EventHostSection = ({ item, accent, relationship }) => {
  const isJam  = item?.type === "jam";
  const isShow = item?.type === "promote_show";

  // ── Creator profile fetch (jams + shows) ──────────────────────────────────
  const [creatorProfile, setCreatorProfile] = useState(null);

  useEffect(() => {
    if ((!isJam && !isShow) || !item?.admin_id) return;

    let cancelled = false;
    supabase
      .from("chat_profile")
      .select("display_name, pfp")
      .eq("user_id", item.admin_id)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setCreatorProfile(data);
      });

    return () => { cancelled = true; };
  }, [isJam, isShow, item?.admin_id]);

  // ── Resolve organizer display ─────────────────────────────────────────────
  let organizerName, organizerAvatarUrl;

  if (isJam || isShow) {
    organizerName      = creatorProfile?.display_name ?? null;
    organizerAvatarUrl = creatorProfile?.pfp ? formatAvatarUrl(creatorProfile.pfp) : null;
  } else {
    organizerName      = extractHostDisplay(item);
    organizerAvatarUrl = null;
  }

  const isYou = relationship === "creator" || relationship === "admin";
  const displayName = organizerName
    ? (isYou ? `${organizerName} (you)` : organizerName)
    : null;

  const organizerRoleLabel =
    isJam        ? "Host"      :
    isShow       ? "Organizer" :
    item?.type === "find_bandmate" ? "Band"     :
    item?.type === "join_band"     ? "Musician" : "Host";

  // ── Venue (shows only) ────────────────────────────────────────────────────
  const venueName = isShow
    ? (item.venueName ?? item.locationName ?? null)
    : null;

  if (!displayName && !venueName) return null;

  return (
    <div className="px-7 py-2 space-y-2">
      {/* Organizer / Host */}
      {displayName && (
        <IdentityRow
          name={displayName}
          roleLabel={organizerRoleLabel}
          accent={accent}
          avatarUrl={organizerAvatarUrl}
        />
      )}

      {/* Venue — shows only, parallel to Organizer row */}
      {venueName && (
        <IdentityRow
          name={venueName}
          roleLabel="Venue"
          accent={accent}
        />
      )}
    </div>
  );
};

export default EventHostSection;
