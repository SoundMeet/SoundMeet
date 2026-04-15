import AutoScrollPillRow from "../ui/AutoScrollPillRow";
import {
  getDiscoveryAccentColor,
  getDiscoveryVariant,
  hexToRgba,
} from "../../utils/discovery";

// ── Icons ──────────────────────────────────────────────────────────────────────

const MusicNoteIcon = ({ className = "text-white/75" }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3z" />
  </svg>
);

const CheckIcon = ({ color = "currentColor" }) => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Ownership indicator used exclusively in the "Hosting" pill. */
const HostIcon = ({ color = "currentColor" }) => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill={color}
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ── Participation helpers ──────────────────────────────────────────────────────

/**
 * Derive the CTA button label based on participation state.
 * Priority: creator > joined > default.
 */
function getCardCtaLabel(item, participationState, variantCtaLabel) {
  if (participationState === "creator") {
    if (item.type === "jam")          return "Manage Jam";
    if (item.type === "promote_show") return "Manage Show";
    return "Manage";
  }
  if (participationState === "joined") {
    if (item.type === "jam")          return "You're Going";
    if (item.type === "promote_show") return "Registered";
    return "Joined";
  }
  if (item.isPrivate && item.type === "jam") return "Invite Only";
  return item.ctaLabel ?? variantCtaLabel;
}

/**
 * Derive the compact status pill label shown beside the event-type label.
 * Returns null when no pill should be rendered.
 */
function getStatusPillLabel(item, participationState) {
  if (participationState === "creator") return "Hosting";
  if (participationState === "joined") {
    if (item.type === "jam")          return "Going";
    if (item.type === "promote_show") return "Registered";
    return "Joined";
  }
  return null;
}

// ── Shared sub-components ──────────────────────────────────────────────────────

const StatusChip = ({ item }) => {
  if (!item.badgeLabel) return null;

  const accent = getDiscoveryAccentColor(item);
  const isLive = item.type === "jam" && item.isLive;
  const isPrivate = item.type === "jam" && item.isPrivate && !item.isLive;

  if (isLive) {
    return (
      <span
        className="shrink-0 flex items-center gap-[5px] px-2.5 h-[24px] rounded-full text-white text-[10.5px] font-bold tracking-wide uppercase"
        style={{
          background: "rgba(220,46,115,0.92)",
          boxShadow:
            "0 0 8px rgba(220,46,115,0.55), 0 0 18px rgba(220,46,115,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <span className="relative flex h-[6px] w-[6px] shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-white" />
        </span>
        Live
      </span>
    );
  }

  return (
    <span
      className={`shrink-0 flex items-center px-2.5 h-[24px] rounded-full text-[10.5px] font-semibold uppercase tracking-wide ${
        isPrivate ? "text-gray-400 border border-white/[0.1]" : "text-white"
      }`}
      style={{
        background: isPrivate
          ? "rgba(38,38,38,0.8)"
          : `linear-gradient(135deg, ${hexToRgba(accent, 0.28)}, rgba(38,38,38,0.92))`,
        boxShadow: isPrivate ? "none" : `0 0 12px ${hexToRgba(accent, 0.18)}`,
      }}
    >
      {item.badgeLabel}
    </span>
  );
};

/**
 * LabelRow — event-type label + optional participation status pill.
 * The pill is intentionally compact so it complements the type label
 * without competing with the title.
 */
const LabelRow = ({ item, accent, participationState = "default" }) => {
  const variant = getDiscoveryVariant(item.type);
  const pillLabel = getStatusPillLabel(item, participationState);

  return (
    <div className="flex items-center gap-[7px] mb-1">
      <span
        className="text-[9px] font-bold uppercase tracking-[0.22em]"
        style={{ color: hexToRgba(accent, 0.92) }}
      >
        {variant.label}
      </span>
      {pillLabel && (
        <span
          className="flex items-center gap-[3px] px-[6px] h-[15px] rounded-full text-[8px] font-bold uppercase tracking-[0.14em] border"
          style={
            participationState === "creator"
              ? {
                  // Ownership pill — solid accent tint, no check icon
                  color: hexToRgba(accent, 0.95),
                  background: hexToRgba(accent, 0.18),
                  borderColor: hexToRgba(accent, 0.4),
                }
              : {
                  // Attendee pill — lighter tint, with check icon
                  color: hexToRgba(accent, 0.9),
                  background: hexToRgba(accent, 0.13),
                  borderColor: hexToRgba(accent, 0.3),
                }
          }
        >
          {participationState === "creator"
            ? <HostIcon color={hexToRgba(accent, 0.88)} />
            : <CheckIcon color={hexToRgba(accent, 0.85)} />}
          {pillLabel}
        </span>
      )}
    </div>
  );
};

const AvatarStack = ({ avatars = [], accent }) => (
  <div className="relative w-[52px] h-[46px] shrink-0">
    {avatars.slice(0, 3).map((avatar, index) => (
      <div
        key={`${avatar.initials}-${index}`}
        className="absolute top-0 w-[30px] h-[30px] rounded-full border border-black/50 flex items-center justify-center text-[10px] font-bold text-white"
        style={{
          left: `${index * 12}px`,
          background: `linear-gradient(135deg, ${avatar.tint ?? accent}, rgba(20,20,20,0.95))`,
          boxShadow: `0 10px 24px ${hexToRgba(accent, 0.18)}`,
        }}
      >
        {avatar.initials}
      </div>
    ))}
    <div
      className="absolute bottom-0 left-0 w-[46px] h-[18px] rounded-full border border-white/10"
      style={{
        background: `linear-gradient(90deg, ${hexToRgba(accent, 0.24)}, rgba(20,20,20,0.92))`,
      }}
    />
  </div>
);

/**
 * CompactVisual — the top-left icon tile.
 * Uses a vibrant accent gradient so it reads alive and inviting at a glance.
 * Pass darkIcon=true when the accent is light-colored (e.g. yellow for shows).
 */
const CompactVisual = ({ item, accent, darkIcon = false }) => {
  if (item.avatarStack?.length) {
    return <AvatarStack avatars={item.avatarStack} accent={accent} />;
  }

  const iconClass = darkIcon ? "text-neutral-900/70" : "text-white/85";

  return (
    <div
      className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
      style={{
        background:
          item.imageGradient ??
          `linear-gradient(145deg, ${hexToRgba(accent, 0.78)} 0%, ${hexToRgba(accent, 0.28)} 100%)`,
        boxShadow: `0 0 0 1px ${hexToRgba(accent, 0.22)}, inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 16px ${hexToRgba(accent, 0.28)}`,
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      ) : item.initials || item.roleLabel || item.posterLabel ? (
        <span
          className={`text-[12px] font-bold tracking-[0.18em] ${darkIcon ? "text-neutral-900/85" : "text-white"}`}
        >
          {item.initials ?? item.roleLabel ?? item.posterLabel}
        </span>
      ) : (
        <MusicNoteIcon className={iconClass} />
      )}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 mb-1.5">
    {children}
  </p>
);

// ── Card body variants ─────────────────────────────────────────────────────────

const JoinBandBody = ({ item, accent, participationState }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} participationState={participationState} />
        <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
        <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
          {item.primaryInstrument} · {item.neighborhood}
        </p>
        <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
          {item.bandGoals}
        </p>
      </div>
      <StatusChip item={item} />
    </div>
    <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-end">
      <div className="min-w-0">
        <SectionTitle>Looking For</SectionTitle>
        <p className="text-[12px] text-gray-300 leading-snug truncate">{item.bandGoals}</p>
      </div>
      <div
        className="px-3 h-8 rounded-full flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] border"
        style={{
          borderColor: hexToRgba(accent, 0.28),
          background: hexToRgba(accent, 0.12),
          color: "#FFFFFF",
        }}
      >
        {item.primaryInstrument}
      </div>
    </div>
    {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
  </>
);

const BandRecruitingBody = ({ item, accent, participationState }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} participationState={participationState} />
        <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
        <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
          {item.neighborhood} · {item.projectType}
        </p>
        <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
          {item.recruitingNote}
        </p>
      </div>
      <StatusChip item={item} />
    </div>
    <div
      className="mt-3 rounded-2xl border px-3.5 py-3"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        background: `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, rgba(20,20,20,0.92))`,
      }}
    >
      <SectionTitle>Needed Role</SectionTitle>
      <p className="text-[14px] font-bold text-white uppercase tracking-[0.14em]">
        {item.neededRole}
      </p>
      <p className="text-[11px] text-gray-400 mt-1 truncate">{item.commitment}</p>
    </div>
    {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
  </>
);

/**
 * ShowBody — unified single-section layout.
 * Venue + distance on line 1, date/time on line 2.
 */
const ShowBody = ({ item, accent, participationState }) => {
  const distLabel =
    item.distanceMiles != null ? `${item.distanceMiles.toFixed(1)} mi` : null;
  const venueLine = [item.venueName, distLabel].filter(Boolean).join(" · ");

  return (
    <>
      <div className="flex items-start gap-3">
        <CompactVisual item={item} accent={accent} darkIcon />
        <div className="flex-1 min-w-0 pt-[1px]">
          <LabelRow item={item} accent={accent} participationState={participationState} />
          <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
          {venueLine ? (
            <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
              {venueLine}
            </p>
          ) : null}
          {item.dateTime ? (
            <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
              {item.dateTime}
            </p>
          ) : null}
        </div>
        <StatusChip item={item} />
      </div>
      {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
    </>
  );
};

/**
 * JamBody — title dominant, distance on meta line, date on secondary.
 * Genres live exclusively in the pills row — never repeated above.
 */
const JamBody = ({ item, accent, participationState }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} participationState={participationState} />
        <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
        {item.metaPrimary ? (
          <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
            {item.metaPrimary}
          </p>
        ) : null}
        {item.metaSecondary && item.metaSecondary !== "Live Now" ? (
          <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
            {item.metaSecondary}
          </p>
        ) : null}
      </div>
      <StatusChip item={item} />
    </div>
    {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
  </>
);

const VariantBody = ({ item, accent, participationState }) => {
  switch (item.type) {
    case "join_band":
      return <JoinBandBody item={item} accent={accent} participationState={participationState} />;
    case "find_bandmate":
      return <BandRecruitingBody item={item} accent={accent} participationState={participationState} />;
    case "promote_show":
      return <ShowBody item={item} accent={accent} participationState={participationState} />;
    case "jam":
    default:
      return <JamBody item={item} accent={accent} participationState={participationState} />;
  }
};

// ── DiscoveryCard ──────────────────────────────────────────────────────────────

const DiscoveryCard = ({
  item,
  isActive = false,
  isSelected = false,
  /**
   * Participation state for the current viewer:
   *   'default'  — no relationship or not logged in
   *   'joined'   — approved attendee / RSVPd
   *   'creator'  — owns the event (future: 'admin')
   */
  participationState = "default",
  onAction,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const accent = getDiscoveryAccentColor(item);
  const variant = getDiscoveryVariant(item.type);

  const isCreator = participationState === "creator";
  const isJoined  = participationState === "joined";

  // Private jams are disabled only for unauthenticated / unrelated users
  const isDisabled = item.type === "jam" && item.isPrivate && participationState === "default";

  // ── Container classes — three distinct ownership tiers ────────────────────
  // creator > joined > default (selected overrides all)
  const containerClass = isSelected
    ? "bg-neutral-800/95 border-white/[0.14]"
    : isCreator
    ? "bg-neutral-800/55 border-white/[0.22] hover:bg-neutral-800/75 hover:border-white/[0.28]"
    : isJoined
    ? "bg-neutral-800/55 border-white/[0.18] hover:bg-neutral-800/75 hover:border-white/[0.22]"
    : isActive
    ? "bg-neutral-800/80 border-white/[0.14]"
    : "bg-neutral-900/85 border-white/[0.09] hover:bg-neutral-800/75 hover:border-white/[0.14]";

  // ── Box shadow — creator ring is slightly stronger than joined ─────────────
  let boxShadow;
  if (isSelected) {
    boxShadow = `0 0 0 1px ${hexToRgba(accent, 0.46)}, 0 0 24px ${hexToRgba(accent, 0.18)}`;
  } else if (isCreator) {
    boxShadow = `0 0 0 1.5px ${hexToRgba(accent, 0.44)}, 0 0 24px ${hexToRgba(accent, 0.16)}, 0 2px 10px rgba(0,0,0,0.28)`;
  } else if (isJoined) {
    boxShadow = `0 0 0 1px ${hexToRgba(accent, 0.34)}, 0 0 18px ${hexToRgba(accent, 0.12)}, 0 2px 10px rgba(0,0,0,0.28)`;
  } else if (isActive) {
    boxShadow = `0 2px 18px rgba(0,0,0,0.34), 0 0 16px ${hexToRgba(accent, 0.08)}`;
  } else {
    boxShadow = "0 2px 10px rgba(0,0,0,0.28)";
  }

  // ── CTA button ─────────────────────────────────────────────────────────────
  const ctaLabel = getCardCtaLabel(item, participationState, variant.ctaLabel);
  // Check icon = attendee confirmation only; creator CTA is an action, not a confirmation
  const showCheckIcon = isJoined;
  const isDarkText = item.type === "promote_show";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-sm border px-4 py-3.5 md:px-5 md:py-4 cursor-pointer transition-all duration-200 ${containerClass}`}
      style={{ boxShadow, touchAction: "manipulation" }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Top accent line — intensity tracks ownership level */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexToRgba(accent, isCreator ? 1.0 : isJoined ? 0.85 : 0.7)}, transparent)`,
          opacity: isSelected || isActive || isCreator || isJoined ? 1 : 0.45,
        }}
      />

      <VariantBody item={item} accent={accent} participationState={participationState} />

      <div className="mt-3 md:mt-3.5">
        <button
          disabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation();
            if (!isDisabled) onAction?.(event);
          }}
          aria-label={ctaLabel}
          className={`w-full h-[36px] md:h-[38px] rounded-full font-bold text-[12px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-[6px] ${
            isDisabled
              ? "bg-neutral-800/80 text-gray-500 border border-white/[0.07] cursor-not-allowed"
              : "hover:brightness-105 active:scale-[0.98]"
          }`}
          style={
            isDisabled
              ? undefined
              : {
                  background: accent,
                  color: isDarkText ? "#111111" : "#FFFFFF",
                  // Creator CTA = action → full glow. Joined CTA = confirmation → soft glow.
                  boxShadow: `0 0 14px ${hexToRgba(accent, isJoined ? 0.16 : 0.20)}, 0 0 28px ${hexToRgba(
                    accent,
                    isJoined ? 0.07 : 0.10
                  )}, 0 3px 10px rgba(0,0,0,0.36)`,
                }
          }
        >
          {isDisabled ? (
            "Invite Only"
          ) : (
            <>
              {showCheckIcon && <CheckIcon color={isDarkText ? "#111111" : "#FFFFFF"} />}
              {ctaLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DiscoveryCard;
