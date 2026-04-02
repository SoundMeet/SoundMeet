import AutoScrollPillRow from "../ui/AutoScrollPillRow";
import {
  getDiscoveryAccentColor,
  getDiscoveryVariant,
  hexToRgba,
} from "../../utils/discovery";

const MusicNoteIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-neutral-500"
  >
    <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3z" />
  </svg>
);

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

const LabelRow = ({ item, accent }) => {
  const variant = getDiscoveryVariant(item.type);

  return (
    <div className="flex items-center gap-2 mb-1">
      <span
        className="text-[9px] font-bold uppercase tracking-[0.22em]"
        style={{ color: hexToRgba(accent, 0.92) }}
      >
        {variant.label}
      </span>
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

const CompactVisual = ({ item, accent, fill = "text-white" }) => {
  if (item.avatarStack?.length) {
    return <AvatarStack avatars={item.avatarStack} accent={accent} />;
  }

  return (
    <div
      className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0 ring-1 ring-white/[0.08] flex items-center justify-center"
      style={{
        background:
          item.imageGradient ??
          `linear-gradient(135deg, ${hexToRgba(accent, 0.42)}, rgba(20,20,20,0.95))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 28px ${hexToRgba(
          accent,
          0.12
        )}`,
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
      ) : item.initials || item.roleLabel || item.posterLabel ? (
        <span className={`text-[12px] font-bold tracking-[0.18em] ${fill}`}>
          {item.initials ?? item.roleLabel ?? item.posterLabel}
        </span>
      ) : (
        <MusicNoteIcon />
      )}
    </div>
  );
};

const SupportingLine = ({ children }) =>
  children ? <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{children}</p> : null;

const SectionTitle = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 mb-1.5">
    {children}
  </p>
);

const JoinBandBody = ({ item, accent }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} />
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

const BandRecruitingBody = ({ item, accent }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} />
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

const ShowBody = ({ item, accent }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} fill="text-black" />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} />
        <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
        <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
          {item.venueName} · {item.neighborhood}
        </p>
        <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
          {item.dateTime}
        </p>
      </div>
      <StatusChip item={item} />
    </div>
    <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 items-center">
      <div
        className="min-w-[84px] h-[52px] rounded-2xl px-3 py-2 border"
        style={{
          borderColor: hexToRgba(accent, 0.24),
          background: `linear-gradient(135deg, ${hexToRgba(accent, 0.24)}, rgba(20,20,20,0.9))`,
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/75 font-bold">When</p>
        <p className="text-[13px] font-bold text-white mt-1 truncate">{item.dateTime}</p>
      </div>
      <div className="min-w-0">
        <SectionTitle>Venue</SectionTitle>
        <p className="text-[12px] text-gray-300 truncate">{item.venueName}</p>
        <p className="text-[11px] text-gray-500 mt-1 truncate">{item.venueType} · Public event pin</p>
      </div>
    </div>
    {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
  </>
);

const JamBody = ({ item, accent }) => (
  <>
    <div className="flex items-start gap-3">
      <CompactVisual item={item} accent={accent} />
      <div className="flex-1 min-w-0 pt-[1px]">
        <LabelRow item={item} accent={accent} />
        <h3 className="text-[1rem] font-bold text-white leading-snug truncate">{item.title}</h3>
        <p className="text-[11.5px] text-gray-400 mt-[3px] leading-none truncate">
          {item.metaPrimary}
        </p>
        <p className="text-[11px] text-gray-500 mt-[5px] leading-none truncate">
          {item.metaSecondary}
        </p>
      </div>
      <StatusChip item={item} />
    </div>
    {item.tags?.length > 0 && <AutoScrollPillRow pills={item.tags} className="mt-3" />}
  </>
);

const VariantBody = ({ item, accent }) => {
  switch (item.type) {
    case "join_band":
      return <JoinBandBody item={item} accent={accent} />;
    case "find_bandmate":
      return <BandRecruitingBody item={item} accent={accent} />;
    case "promote_show":
      return <ShowBody item={item} accent={accent} />;
    case "jam":
    default:
      return <JamBody item={item} accent={accent} />;
  }
};

const DiscoveryCard = ({
  item,
  isActive = false,
  isSelected = false,
  onAction,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const accent = getDiscoveryAccentColor(item);
  const variant = getDiscoveryVariant(item.type);
  const isDisabled = item.type === "jam" && item.isPrivate;

  const containerClass = isSelected
    ? "bg-neutral-800/95 border-white/[0.14]"
    : isActive
    ? "bg-neutral-800/80 border-white/[0.14]"
    : "bg-neutral-900/85 border-white/[0.09] hover:bg-neutral-800/75 hover:border-white/[0.14]";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-sm border px-5 py-4 cursor-pointer transition-all duration-200 ${containerClass}`}
      style={{
        boxShadow: isSelected
          ? `0 0 0 1px ${hexToRgba(accent, 0.46)}, 0 0 24px ${hexToRgba(accent, 0.18)}`
          : isActive
          ? `0 2px 18px rgba(0,0,0,0.34), 0 0 16px ${hexToRgba(accent, 0.08)}`
          : "0 2px 10px rgba(0,0,0,0.28)",
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexToRgba(accent, 0.7)}, transparent)`,
          opacity: isSelected || isActive ? 1 : 0.45,
        }}
      />

      <VariantBody item={item} accent={accent} />

      <div className="mt-3.5">
        <button
          disabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation();
            if (!isDisabled) onAction?.(event);
          }}
          className={`w-full h-[42px] rounded-full font-bold text-[12.5px] uppercase tracking-wider transition-all duration-200 ${
            isDisabled
              ? "bg-neutral-800/80 text-gray-500 border border-white/[0.07] cursor-not-allowed"
              : "text-white hover:brightness-105 active:scale-[0.98]"
          }`}
          style={
            isDisabled
              ? undefined
              : {
                  background: accent,
                  color: item.type === "promote_show" ? "#111111" : "#FFFFFF",
                  boxShadow: `0 0 16px ${hexToRgba(accent, 0.34)}, 0 0 36px ${hexToRgba(
                    accent,
                    0.14
                  )}, 0 4px 12px rgba(0,0,0,0.38)`,
                }
          }
        >
          {isDisabled ? "Invite Only" : item.ctaLabel ?? variant.ctaLabel}
        </button>
      </div>
    </div>
  );
};

export default DiscoveryCard;
