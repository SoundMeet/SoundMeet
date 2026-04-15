import { motion } from "framer-motion";
import LogowText from "../assets/LogowText.svg";
import {
  getDiscoveryAccentColor,
  getDiscoveryPreviewEyebrowItems,
  hexToRgba,
} from "../utils/discovery";

const DiscoverPreview = ({
  variant = "discovery",
  item,
  onViewItem,
  onDismiss,
  onSignUp,
  onLogIn,
}) => {
  if (variant === "discovery" && !item) return null;
  const accent = variant === "discovery" ? getDiscoveryAccentColor(item) : "#DC2E73";

  const blob = (overrides) => ({
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: -1,
    ...overrides,
  });

  const motionKey = variant === "welcome" ? "__welcome__" : item?.id;

  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative w-[calc(100vw-32px)] max-w-[460px] px-6 py-5 overflow-visible"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          top: "-40px",
          left: "-60px",
          right: "-80px",
          bottom: "-100px",
          background: `
            radial-gradient(
              ellipse 110% 90% at 10% 90%,
              rgba(0,0,0,0.72) 0%,
              rgba(0,0,0,0.52) 30%,
              rgba(0,0,0,0.28) 58%,
              rgba(0,0,0,0.00) 82%
            )
          `,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <div
        style={blob({
          width: "360px",
          height: "280px",
          bottom: "-80px",
          left: "-80px",
          background: hexToRgba(accent, 0.32),
          filter: "blur(78px)",
        })}
      />
      <div
        style={blob({
          width: "200px",
          height: "180px",
          bottom: "-40px",
          left: "-40px",
          background: hexToRgba(accent, 0.26),
          filter: "blur(50px)",
        })}
      />
      <div
        style={blob({
          width: "520px",
          height: "320px",
          bottom: "-120px",
          left: "-120px",
          background: hexToRgba(accent, 0.13),
          filter: "blur(95px)",
        })}
      />

      {variant === "discovery" && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close preview"
          className="absolute top-0 right-0 w-11 h-11 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      )}

      {variant === "discovery" ? (
        <DiscoveryContent item={item} onViewItem={onViewItem} accent={accent} />
      ) : (
        <WelcomeContent onSignUp={onSignUp} onLogIn={onLogIn} />
      )}
    </motion.div>
  );
};

const EyebrowRow = ({ items, accent = "#e8447e" }) => (
  <div className="relative flex items-center gap-3 mb-5 w-fit">
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "-10px -48px -10px -32px",
        background: `linear-gradient(
          to right,
          rgba(0,0,0,0.00) 0%,
          rgba(0,0,0,0.58) 12%,
          rgba(0,0,0,0.68) 40%,
          rgba(0,0,0,0.68) 65%,
          rgba(0,0,0,0.30) 85%,
          rgba(0,0,0,0.00) 100%
        )`,
        filter: "blur(8px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
    {items.map((label, i) => (
      <span key={label} className="relative z-10 flex items-center gap-3">
        <span
          className="text-[12px] font-bold uppercase tracking-[0.15em]"
          style={{
            textShadow: `0 1px 6px rgba(0,0,0,1), 0 0 14px rgba(0,0,0,0.95), 0 0 20px ${hexToRgba(
              accent,
              0.55
            )}`,
            color: accent,
          }}
        >
          {label}
        </span>
        {i < items.length - 1 && (
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: hexToRgba(accent, 0.45) }}
          />
        )}
      </span>
    ))}
  </div>
);

const DiscoveryContent = ({ item, onViewItem, accent }) => {
  const pills = getDiscoveryPreviewEyebrowItems(item);

  return (
    <>
      <EyebrowRow items={pills} accent={accent} />

      <p
        className="text-[12px] font-bold uppercase tracking-[0.22em] mb-3"
        style={{
          color: hexToRgba(accent, 0.94),
          textShadow: `0 0 16px ${hexToRgba(accent, 0.3)}`,
        }}
      >
        {item.heroKicker}
      </p>

      <h3
        className="text-[2.75rem] font-black text-white leading-[1.02] mb-4 uppercase tracking-tight"
        style={{
          textShadow:
            "0 2px 12px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.98), 0 0 64px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,1)",
        }}
      >
        {item.heroTitle ?? item.title}
      </h3>

      <p
        className="text-[14px] text-gray-300 leading-relaxed mb-7 max-w-[360px]"
        style={{ textShadow: "0 1px 10px rgba(0,0,0,1), 0 2px 24px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.95)" }}
      >
        {item.heroDescription ?? item.description}
      </p>

      <button
        onClick={onViewItem}
        className="inline-flex items-center gap-2.5 px-7 h-12 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
        style={{
          background: accent,
          color: item.type === "promote_show" ? "#111111" : "#FFFFFF",
          boxShadow: `0 0 24px ${hexToRgba(accent, 0.45)}, 0 0 52px ${hexToRgba(
            accent,
            0.16
          )}, 0 6px 20px rgba(0,0,0,0.70)`,
        }}
      >
        {item.previewCtaLabel}
        <span className="text-base leading-none">→</span>
      </button>
    </>
  );
};

const WelcomeContent = ({ onSignUp, onLogIn }) => (
  <>
    <EyebrowRow items={["DISCOVER", "CONNECT", "JAM"]} accent="#DC2E73" />
    <div className="mb-4">
      <p
        className="text-[1.6rem] font-bold text-white/90 leading-none uppercase tracking-wide mb-2"
        style={{
          textShadow:
            "0 2px 12px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.98), 0 1px 4px rgba(0,0,0,1)",
        }}
      >
        Welcome to
      </p>
      <img
        src={LogowText}
        alt="SoundMeet"
        style={{
          height: "3.4rem",
          width: "auto",
          filter:
            "drop-shadow(0 2px 10px rgba(0,0,0,1)) drop-shadow(0 0 28px rgba(0,0,0,0.95))",
        }}
      />
    </div>

    <p
      className="text-[13.5px] text-gray-300 leading-relaxed mb-5 max-w-[280px]"
      style={{ textShadow: "0 1px 10px rgba(0,0,0,1), 0 2px 24px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.95)" }}
    >
      Find nearby jams, meet local musicians, and discover what's happening around you. Connect through music.
    </p>

    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onSignUp}
          className="inline-flex items-center px-6 h-11 rounded-full bg-gradient-to-r from-[#dc2e73] to-[#e8447e] text-white text-[14px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            boxShadow:
              "0 0 24px rgba(220,46,115,0.60), 0 0 52px rgba(220,46,115,0.18), 0 6px 20px rgba(0,0,0,0.70)",
          }}
        >
          Sign Up
        </button>

        <button
          onClick={onLogIn}
          className="inline-flex items-center px-6 h-11 rounded-full text-black text-[14px] font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            background: "#F7C10D",
            boxShadow:
              "0 0 18px rgba(247,193,13,0.55), 0 0 40px rgba(247,193,13,0.18), 0 6px 20px rgba(0,0,0,0.60)",
          }}
        >
          Log In
        </button>
      </div>
      <p
        className="text-[11px] text-neutral-500 leading-none pl-0.5"
        style={{ textShadow: "0 1px 10px rgba(0,0,0,1)" }}
      >
        Already have an account? Log in to continue.
      </p>
    </div>
  </>
);

export default DiscoverPreview;
