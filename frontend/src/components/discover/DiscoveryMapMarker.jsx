import {
  getDiscoveryAccentColor,
  getDiscoveryMarkerMode,
  getDiscoveryVariant,
  hexToRgba,
  metersToPixels,
} from "../../utils/discovery";
import { getListingInstrumentEmoji } from "../../utils/instrumentEmoji";

const PinGlyph = ({ children, fill = "#FFFFFF", fontSize = 16, fontWeight = 400 }) => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
    style={{
      color: fill,
      fontSize,
      fontWeight,
      lineHeight: 1,
      transform: "translateY(-5px)",
    }}
  >
    <span aria-hidden="true">{children}</span>
  </div>
);

const ExactMarker = ({ item, isSelected, isHovered, onClick, onDoubleClick, onMouseEnter, onMouseLeave }) => {
  const accent = getDiscoveryAccentColor(item);
  const glyph = getDiscoveryVariant(item.type).markerGlyph;
  const pulse = item.type === "jam" && item.isLive;
  const baseSize = item.type === "promote_show" ? 38 : item.isLive ? 42 : 36;
  const scale = isSelected ? 1.35 : isHovered ? 1.12 : 1;
  const size = Math.round(baseSize * scale);
  const pinHeight = Math.round(size * 1.35);

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer"
      style={{
        transformOrigin: "bottom center",
        transform: `scale(${scale})`,
        transition: "transform 150ms ease-out",
        zIndex: isSelected ? 50 : isHovered ? 40 : 20,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: baseSize + 14,
            height: baseSize + 14,
            border: "2.5px solid rgba(255,255,255,0.72)",
            boxShadow: `0 0 12px ${hexToRgba(accent, 0.6)}`,
            top: -(baseSize + 14) / 2 + baseSize / 2 - 4,
            left: -(baseSize + 14) / 2 + baseSize / 2,
          }}
        />
      )}

      {pulse && (
        <div
          className="absolute rounded-full animate-ping opacity-30 pointer-events-none"
          style={{
            width: baseSize + 16,
            height: baseSize + 16,
            backgroundColor: accent,
            top: -(baseSize + 16) / 2 + baseSize / 2 - 4,
            left: -(baseSize + 16) / 2 + baseSize / 2,
          }}
        />
      )}

      <svg
        width={size}
        height={pinHeight}
        viewBox="0 0 36 48"
        style={{
          filter: isSelected
            ? `drop-shadow(0 3px 10px ${hexToRgba(accent, 0.8)}) drop-shadow(0 0 6px ${hexToRgba(
                accent,
                0.5
              )})`
            : `drop-shadow(0 2px 6px ${hexToRgba(accent, 0.5)})`,
          transition: "filter 150ms ease-out",
        }}
      >
        <path
          d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
          fill={accent}
        />
      </svg>
      <PinGlyph
        fill={item.type === "promote_show" ? "#111111" : "#FFFFFF"}
        fontSize={16}
        fontWeight={700}
      >
        {glyph}
      </PinGlyph>
    </div>
  );
};

const PinBody = ({
  accent,
  isSelected,
  isHovered,
  fill = "#FFFFFF",
  children,
}) => {
  const baseSize = 36;
  const scale = isSelected ? 1.35 : isHovered ? 1.12 : 1;
  const size = Math.round(baseSize * scale);
  const pinHeight = Math.round(size * 1.35);

  return (
    <>
      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: baseSize + 14,
            height: baseSize + 14,
            border: "2.5px solid rgba(255,255,255,0.72)",
            boxShadow: `0 0 12px ${hexToRgba(accent, 0.58)}`,
            top: -(baseSize + 14) / 2 + baseSize / 2 - 4,
            left: -(baseSize + 14) / 2 + baseSize / 2,
          }}
        />
      )}

      <svg
        width={size}
        height={pinHeight}
        viewBox="0 0 36 48"
        style={{
          filter: isSelected
            ? `drop-shadow(0 3px 10px ${hexToRgba(accent, 0.78)}) drop-shadow(0 0 6px ${hexToRgba(
                accent,
                0.42
              )})`
            : `drop-shadow(0 2px 6px ${hexToRgba(accent, 0.44)})`,
          transition: "filter 150ms ease-out",
        }}
      >
        <path
          d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
          fill={accent}
        />
      </svg>
      <PinGlyph fill={fill} fontSize={15}>{children}</PinGlyph>
    </>
  );
};

const ApproximateBadge = ({ label, accent, visible }) =>
  visible ? (
    <div
      className="absolute left-1/2 top-full mt-2 -translate-x-1/2 px-2.5 h-7 rounded-full flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-white border"
      style={{
        background: "rgba(20,20,20,0.92)",
        borderColor: hexToRgba(accent, 0.28),
        boxShadow: `0 12px 28px rgba(0,0,0,0.35), 0 0 16px ${hexToRgba(accent, 0.14)}`,
      }}
    >
      {label}
    </div>
  ) : null;

const ApproximateAura = ({ accent, radiusPx, isSelected, isHovered, borderStyle = "solid" }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: radiusPx * 2,
      height: radiusPx * 2,
      left: -radiusPx,
      top: -radiusPx,
      background: `radial-gradient(circle, ${hexToRgba(accent, 0.18)} 0%, ${hexToRgba(
        accent,
        0.1
      )} 42%, rgba(0,0,0,0) 100%)`,
      border: `1px ${borderStyle} ${hexToRgba(accent, isSelected ? 0.4 : isHovered ? 0.28 : 0.22)}`,
      boxShadow: `0 0 36px ${hexToRgba(accent, 0.16)}`,
      transform: isSelected ? "scale(1.03)" : "scale(1)",
      transition: "all 180ms ease-out",
    }}
  />
);

const JoinBandMarker = ({ item, accent, radiusPx, isSelected, isHovered }) => {
  const glyph = getListingInstrumentEmoji(item);
  return (
    <>
      <ApproximateAura
        accent={accent}
        radiusPx={radiusPx}
        isSelected={isSelected}
        isHovered={isHovered}
      />
      <PinBody accent={accent} isSelected={isSelected} isHovered={isHovered}>
        {glyph}
      </PinBody>
    </>
  );
};

const RecruitingMarker = ({ item, accent, radiusPx, isSelected, isHovered }) => {
  const glyph = getListingInstrumentEmoji(item);
  return (
    <>
      <ApproximateAura
        accent={accent}
        radiusPx={radiusPx}
        isSelected={isSelected}
        isHovered={isHovered}
      />
      <PinBody accent={accent} isSelected={isSelected} isHovered={isHovered}>
        {glyph}
      </PinBody>
    </>
  );
};

const ApproximateMarker = ({
  item,
  isSelected,
  isHovered,
  zoom,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const accent = getDiscoveryAccentColor(item);
  const coords = item.approximateCoordinates ?? item.coordinates;
  const radiusPx = metersToPixels(item.approximateRadiusMeters ?? 900, coords?.latitude, zoom);
  const showLabel = isSelected || isHovered;

  return (
    <div
      className="relative cursor-pointer"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(event) => event.stopPropagation()}
      style={{ zIndex: isSelected ? 45 : isHovered ? 35 : 15 }}
    >
      {item.type === "join_band" ? (
        <JoinBandMarker
          item={item}
          accent={accent}
          radiusPx={radiusPx}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      ) : (
        <RecruitingMarker
          item={item}
          accent={accent}
          radiusPx={radiusPx}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      )}

      <ApproximateBadge
        accent={accent}
        visible={showLabel}
        label={item.type === "join_band" ? `${item.neighborhood} · player` : item.neighborhood}
      />
    </div>
  );
};

const DiscoveryMapMarker = (props) => {
  if (getDiscoveryMarkerMode(props.item) === "approximate") {
    return <ApproximateMarker {...props} />;
  }

  return <ExactMarker {...props} />;
};

export default DiscoveryMapMarker;
