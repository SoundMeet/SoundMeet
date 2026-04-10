import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hexToRgba, getDiscoveryVariant } from "../../utils/discovery";
import { extractHostDisplay } from "../../utils/eventComputed";

// ─── Icon helpers ──────────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/** Icon + text row inside the hero info column */
const HeroMetaRow = ({ icon, children }) => (
  <div className="flex items-start gap-1.5">
    <span className="shrink-0 mt-[3px] text-neutral-500">{icon}</span>
    <span className="text-[13px] text-neutral-400 leading-snug min-w-0 block">{children}</span>
  </div>
);

/**
 * EventModalHeader — top section of the modal.
 *
 * Layout modes:
 *   poster mode   — two-column hero: portrait poster left, info column right
 *   no-poster     — single-column, intentionally full-width, title-led
 *   promote_show  — full-width hero banner image above the header body
 *
 * The description is rendered inline in the hero when it is short (≤ 160 chars),
 * anchoring it to the identity block instead of floating it in the scroll body.
 *
 * Props:
 *   item            - discovery item
 *   lifecycle       - 'live'|'upcoming'|'ended'|'cancelled'
 *   relationship    - viewer relationship string
 *   accent          - hex accent colour
 *   onClose         - close handler
 *   canSeeLocation  - boolean from canRevealExactLocation
 *   description     - optional description string (short ones rendered inline here)
 */
const EventModalHeader = ({
  item,
  lifecycle,
  relationship,
  accent,
  onClose,
  onShare,
  canSeeLocation,
  description,
  isEditing = false,
}) => {
  const [addressCopied, setAddressCopied] = useState(false);
  const [shareCopied,   setShareCopied]   = useState(false);
  const [posterOpen, setPosterOpen]       = useState(false);

  // Close lightbox on Escape
  useEffect(() => {
    if (!posterOpen) return;
    const handle = (e) => { if (e.key === "Escape") setPosterOpen(false); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [posterOpen]);

  const variant        = getDiscoveryVariant(item.type);
  const isShow         = item.type === "promote_show";
  const isJam          = item.type === "jam";
  const coverImageUrl  = item.coverImageUrl ?? null;
  const showPoster     = !!coverImageUrl;
  // Jams and shows always use the two-column layout — real image or letter placeholder
  const useTwoColumn   = showPoster || isShow || isJam;

  // ── Title length → adaptive sizing ────────────────────────────────────────────
  const titleLength = item.title?.length ?? 0;
  // Poster info column is narrower (~420 px); no-poster has full width (~544 px)
  const posterTitleClass = titleLength > 45
    ? "text-[1.08rem] font-bold text-white leading-snug tracking-tight"
    : "text-[1.18rem] font-bold text-white leading-snug tracking-tight";
  const noPosterTitleClass = titleLength > 50
    ? "text-[1.2rem] font-bold text-white leading-snug tracking-tight"
    : "text-[1.35rem] font-bold text-white leading-snug tracking-tight";

  // ── Short description rendered in the hero ────────────────────────────────────
  // Attaches the jam vibe summary to the identity block instead of the scroll body.
  const inlineDesc = description && description.length <= 160 ? description : null;

  // ── Metadata ──────────────────────────────────────────────────────────────────
  // Shows: venue name already appears in the location row — suppress the redundant host row.
  const hostName       = isShow ? null : extractHostDisplay(item);
  const dateTime       = item.dateTime ?? item.date ?? item.metaSecondary ?? null;
  const distance       = item.distanceMiles != null
    ? `${Number(item.distanceMiles).toFixed(1)} mi away`
    : null;
  const exactLocation  = item.locationName ?? item.locationAddress ?? item.venueName ?? item.neighborhood ?? null;
  const approxLocation = item.neighborhood ?? null;
  const displayLocation = canSeeLocation ? exactLocation : approxLocation;
  const locationLine   = [displayLocation, distance].filter(Boolean).join(" · ");

  // Street address: secondary line, venue name prefix stripped
  const streetAddress = (() => {
    if (!canSeeLocation || !item.locationAddress) return null;
    const addr = item.locationAddress;
    const name = item.locationName;
    if (name && addr.startsWith(name + ", ")) return addr.slice(name.length + 2);
    if (name && addr === name) return null;
    return addr;
  })();

  const copyableAddress = item.locationAddress ?? null;

  // ── Copy address handler ──────────────────────────────────────────────────────
  const handleCopyAddress = () => {
    if (!copyableAddress) return;
    const done = () => {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 1600);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyableAddress).then(done).catch(() => {});
    } else {
      const el = document.createElement("textarea");
      el.value = copyableAddress;
      el.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); done(); } catch (_) {}
      document.body.removeChild(el);
    }
  };

  // ── Reusable sub-elements ─────────────────────────────────────────────────────

  const handleShare = () => {
    if (!onShare) return;
    onShare();
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1600);
  };

  const headerActions = (
    <div className="flex items-center gap-1.5 shrink-0">
      {onShare && (
        <button
          onClick={handleShare}
          aria-label={shareCopied ? "Link copied!" : "Copy share link"}
          title={shareCopied ? "Copied!" : "Share event"}
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            background: "rgba(255,255,255,0.07)",
            color: shareCopied ? "rgba(229,226,225,0.75)" : "rgba(229,226,225,0.4)",
          }}
          onMouseEnter={(e) => { if (!shareCopied) e.currentTarget.style.color = "rgba(229,226,225,0.65)"; }}
          onMouseLeave={(e) => { if (!shareCopied) e.currentTarget.style.color = "rgba(229,226,225,0.4)"; }}
        >
          {shareCopied ? <CheckIcon /> : <ShareIcon />}
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Close event details"
        className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:text-white transition-all duration-150"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );

  const badgePills = (
    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
      <span
        className="inline-flex items-center h-6 px-3 rounded-full text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{
          color: accent,
          background: hexToRgba(accent, 0.2),
          border: `1px solid ${hexToRgba(accent, 0.38)}`,
        }}
      >
        {variant.label}
      </span>
      {lifecycle === "live" && (
        <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] text-red-400 border border-red-400/20 bg-red-400/10">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
          Live Now
        </span>
      )}
      {lifecycle === "ended" && (
        <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-neutral-500 border border-white/10">
          Ended
        </span>
      )}
      {lifecycle === "cancelled" && (
        <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-red-400 border border-red-400/20">
          Cancelled
        </span>
      )}
      {item.isPrivate && (
        <span className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium text-neutral-400 border border-white/10">
          Private
        </span>
      )}
      {relationship === "approved" && !isEditing && (
        <span
          className="h-6 px-3 flex items-center gap-1.5 rounded-full text-[10px] font-bold border"
          style={{
            color: accent,
            borderColor: hexToRgba(accent, 0.32),
            background: hexToRgba(accent, 0.11),
          }}
        >
          <CheckIcon />
          {item.type === "promote_show" ? "Registered" : "Going"}
        </span>
      )}
      {(relationship === "creator" || relationship === "admin") && !isEditing && (
        <span
          className="h-6 px-3 flex items-center rounded-full text-[10px] font-medium border"
          style={{
            color: accent,
            borderColor: hexToRgba(accent, 0.25),
            background: hexToRgba(accent, 0.08),
          }}
        >
          {relationship === "creator" ? "Your Event" : "Admin"}
        </span>
      )}
      {isEditing && (
        <span
          className="h-6 px-3 flex items-center gap-1.5 rounded-full text-[10px] font-semibold border"
          style={{
            color: accent,
            borderColor: hexToRgba(accent, 0.35),
            background: hexToRgba(accent, 0.14),
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editing
        </span>
      )}
    </div>
  );

  // ── Location row ─────────────────────────────────────────────────────────────
  // Copy button is inline within the text block so it reads as attached to the
  // address rather than floating independently at the right edge of the row.
  const locationRow = (locationLine || streetAddress) ? (
    <div className="flex items-start gap-1.5">
      <span className="shrink-0 mt-[3px] text-neutral-500">
        {canSeeLocation ? <PinIcon /> : <LockIcon />}
      </span>

      {/* Address text — plain, naturally selectable */}
      <span className="text-[13px] leading-snug min-w-0">
        <span className={canSeeLocation ? "text-neutral-400" : "italic text-neutral-500"}>
          {locationLine}
          {!canSeeLocation && item.isPrivate && (
            <span className="ml-1 text-neutral-600 not-italic"> (hidden)</span>
          )}
          {/* Copy affordance — inline, immediately after address text */}
          {canSeeLocation && copyableAddress && (
            <button
              onClick={handleCopyAddress}
              aria-label={addressCopied ? "Address copied" : "Copy address"}
              title={addressCopied ? "Copied!" : "Copy address"}
              className="inline-flex items-center ml-1.5 align-middle relative top-[-1px] transition-colors duration-150"
              style={{ color: addressCopied ? "rgba(229,226,225,0.6)" : "rgba(229,226,225,0.3)" }}
              onMouseEnter={(e) => { if (!addressCopied) e.currentTarget.style.color = "rgba(229,226,225,0.5)"; }}
              onMouseLeave={(e) => { if (!addressCopied) e.currentTarget.style.color = "rgba(229,226,225,0.3)"; }}
            >
              {addressCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
          )}
        </span>
        {streetAddress && (
          <span className="block text-[12px] text-neutral-500 mt-0.5 leading-snug">
            {streetAddress}
          </span>
        )}
      </span>
    </div>
  ) : null;

  // ── Metadata block ────────────────────────────────────────────────────────────
  const metaRows = (hostName || dateTime || locationLine || streetAddress) ? (
    <div className="mt-2 space-y-1">
      {hostName && <HeroMetaRow icon={<PersonIcon />}>{hostName}</HeroMetaRow>}
      {dateTime  && <HeroMetaRow icon={<ClockIcon />}>{dateTime}</HeroMetaRow>}
      {locationRow}
    </div>
  ) : null;

  // ── Short description block ───────────────────────────────────────────────────
  // Attached to the identity block so it reads as vibe context, not a loose paragraph.
  const inlineDescBlock = inlineDesc ? (
    <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed">
      {inlineDesc}
    </p>
  ) : null;

  return (
    <>
      {/* Accent colour bar */}
      <div
        className="h-[6px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${hexToRgba(accent, 0.5)}, ${accent}, ${hexToRgba(accent, 0.42)})`,
        }}
      />

      {/* Header body */}
      <div className="px-6 pt-4 pb-4 shrink-0">
        {useTwoColumn ? (
          /* ── Two-column hero: real poster or letter placeholder ─────────── */
          <div className="flex gap-4 items-start">
            {showPoster ? (
              /* Real image — expandable */
              <button
                onClick={() => setPosterOpen(true)}
                aria-label={`View ${item.title} poster`}
                className="shrink-0 rounded-2xl overflow-hidden relative group"
                style={{ width: 92, height: isShow ? 130 : 116, border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <img
                  src={coverImageUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                {/* Expand hint — visible on hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </div>
              </button>
            ) : (
              /* Letter placeholder — not expandable */
              <div
                className="shrink-0 rounded-2xl flex items-center justify-center select-none"
                style={{
                  width: 92,
                  height: isShow ? 130 : 116,
                  background: `linear-gradient(145deg, ${hexToRgba(accent, 0.82)}, ${hexToRgba(accent, 0.28)})`,
                  border: `1px solid ${hexToRgba(accent, 0.3)}`,
                  boxShadow: `0 0 24px ${hexToRgba(accent, 0.2)}`,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: isShow ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.88)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {isJam ? "J" : "S"}
                </span>
              </div>
            )}

            {/* Info column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                {badgePills}
                {headerActions}
              </div>
              <h2 id="event-detail-title" className={posterTitleClass}>
                {item.title}
              </h2>
              {metaRows}
              {inlineDescBlock}
            </div>
          </div>
        ) : (
          /* ── No-poster mode: full-width, title-led (other event types) ──── */
          <>
            <div className="flex items-start justify-between gap-3 mb-2.5">
              {badgePills}
              {headerActions}
            </div>
            <h2 id="event-detail-title" className={noPosterTitleClass}>
              {item.title}
            </h2>
            {metaRows}
            {inlineDescBlock}
          </>
        )}
      </div>

      {/* ── Poster lightbox ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {posterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="poster-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[200]"
              style={{ background: "rgba(0,0,0,0.88)" }}
              onClick={() => setPosterOpen(false)}
              aria-hidden="true"
            />

            {/* Image container — centers and constrains within viewport */}
            <div
              className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
              role="dialog"
              aria-modal="true"
              aria-label={`${item.title} poster`}
            >
              <motion.div
                key="poster-image"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative pointer-events-auto"
                style={{ maxWidth: "min(520px, 90vw)", maxHeight: "85vh" }}
              >
                <img
                  src={coverImageUrl}
                  alt={item.title}
                  className="block rounded-2xl object-contain"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "85vh",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
                  }}
                />

                {/* Close button */}
                <button
                  onClick={() => setPosterOpen(false)}
                  aria-label="Close poster"
                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150"
                  style={{ background: "rgba(30,30,32,0.95)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(229,226,225,0.7)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(229,226,225,0.7)"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                  </svg>
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EventModalHeader;
