import React, { useState } from "react";
import { motion } from "framer-motion";
import { LINK_PLATFORMS, ExternalLinkIcon } from "../../utils/linkPlatforms";

// ── ProfileLinksCard ──────────────────────────────────────────────────────────────
// Displays a profile's social / artist links.
// Only platforms with values are shown; empty state shown for own profile.
//
// Props
//   links        { spotify, soundcloud, bandcamp, youtube, instagram, tiktok }
//   isOwnProfile boolean
//   onEditClick  () => void  — opens edit modal at the Links section
// ─────────────────────────────────────────────────────────────────────────────────

const DEFAULT_SHOW = 4;

export function ProfileLinksCard({ links = {}, isOwnProfile = false, onEditClick }) {
  const [expanded, setExpanded] = useState(false);

  const activePlatforms = LINK_PLATFORMS.filter((p) => links[p.key]);
  const visiblePlatforms = expanded
    ? activePlatforms
    : activePlatforms.slice(0, DEFAULT_SHOW);
  const hiddenCount = Math.max(0, activePlatforms.length - DEFAULT_SHOW);
  const hasLinks = activePlatforms.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut", delay: 0.14 }}
      className="rounded-2xl p-5 backdrop-blur-md"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
          Links
        </span>
        {isOwnProfile && (
          <button
            onClick={onEditClick}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all hover:opacity-80"
            style={{
              color: "#DC2E73",
              background: "rgba(220,46,115,0.10)",
              border: "1px solid rgba(220,46,115,0.20)",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 13 13" fill="none">
              <path
                d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            {hasLinks ? "Edit" : "Add Links"}
          </button>
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!hasLinks ? (
        isOwnProfile ? (
          <button
            onClick={onEditClick}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-7 transition-all duration-200 hover:opacity-80 text-left"
            style={{
              border: "1px dashed rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ fontSize: "22px", opacity: 0.3 }}>🔗</span>
            <span className="text-sm font-medium text-white/30">Add your links</span>
            <span className="text-xs text-white/15">
              Spotify, SoundCloud, Instagram &amp; more
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <span style={{ fontSize: "20px", opacity: 0.2 }}>🔗</span>
            <p className="text-xs text-white/25">No links yet</p>
          </div>
        )
      ) : (
        /* ── Link rows ──────────────────────────────────────────────────────── */
        <div className="flex flex-col gap-1">
          {visiblePlatforms.map((platform) => {
            const url     = links[platform.key];
            const handle  = platform.displayHandle(url);
            const { Icon } = platform;
            return (
              <a
                key={platform.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150"
                style={{
                  background: "transparent",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {/* Platform icon */}
                <div
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  <Icon />
                </div>

                {/* Platform name + handle */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white/70 leading-none mb-0.5">
                    {platform.label}
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {handle}
                  </div>
                </div>

                {/* External link arrow */}
                <div
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  <ExternalLinkIcon size={11} />
                </div>
              </a>
            );
          })}

          {/* ── Show more / less ─────────────────────────────────────────────── */}
          {!expanded && hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1 self-start text-[11px] font-medium px-3 py-1 rounded-lg transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.40)", background: "rgba(255,255,255,0.04)" }}
            >
              +{hiddenCount} more
            </button>
          )}
          {expanded && activePlatforms.length > DEFAULT_SHOW && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-1 self-start text-[11px] transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Show less ↑
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── LinksEditSection ──────────────────────────────────────────────────────────────
// Renders inside the Edit Profile modal when the "Links" tab is active.
//
// Props
//   links        current draft { spotify, soundcloud, … }
//   onChange     (platform_key, value) => void
// ─────────────────────────────────────────────────────────────────────────────────

export function LinksEditSection({ links = {}, onChange }) {
  // Store raw (pre-normalized) input per platform so typing feels natural.
  // We normalize on blur.
  const [rawValues, setRawValues] = useState(() => {
    const init = {};
    LINK_PLATFORMS.forEach((p) => { init[p.key] = links[p.key] || ""; });
    return init;
  });

  const handleChange = (key, val) => {
    setRawValues((prev) => ({ ...prev, [key]: val }));
    // Propagate raw value immediately so Cancel can revert correctly
    onChange(key, val);
  };

  const handleBlur = (platform, val) => {
    const normalized = platform.normalize(val);
    setRawValues((prev) => ({ ...prev, [platform.key]: normalized }));
    onChange(platform.key, normalized);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-neutral-500 leading-relaxed">
        Only platforms with a value are shown on your profile.
        You can paste a full URL or just your handle for most platforms.
      </p>

      <div className="flex flex-col gap-3">
        {LINK_PLATFORMS.map((platform) => {
          const { Icon } = platform;
          const raw = rawValues[platform.key] ?? "";
          const hasSavedValue = !!links[platform.key];

          return (
            <div key={platform.key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  <Icon />
                </div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.08em]">
                  {platform.label}
                </label>
                {hasSavedValue && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ color: "#4ade80", background: "rgba(74,222,128,0.10)" }}>
                    Saved
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={raw}
                  placeholder={platform.placeholder}
                  onChange={(e) => handleChange(platform.key, e.target.value)}
                  onBlur={(e) => handleBlur(platform, e.target.value)}
                  className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none border border-transparent focus:border-[#DC2E73]/40 transition-colors"
                />
                {raw && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawValues((prev) => ({ ...prev, [platform.key]: "" }));
                      onChange(platform.key, "");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white/50 transition-colors"
                    aria-label={`Clear ${platform.label}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HeroLinks ─────────────────────────────────────────────────────────────────
// Compact featured links block for the profile hero area (right of identity).
// Renders null when there are no active links — caller handles the layout gap.
//
// Props
//   links        { spotify, soundcloud, … }
//   isOwnProfile boolean — unused in display but kept for future affordances
// ─────────────────────────────────────────────────────────────────────────────

const HERO_MAX = 3;

export function HeroLinks({ links = {} }) {
  const active = LINK_PLATFORMS.filter((p) => links[p.key]).slice(0, HERO_MAX);

  if (active.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.18 }}
      className="lg:w-[192px] shrink-0 flex flex-col gap-0.5 mt-1"
    >
      {/* Section label */}
      <span
        className="text-[10px] font-bold uppercase tracking-[0.10em] mb-1.5 select-none"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        Links
      </span>

      {active.map((platform) => {
        const url    = links[platform.key];
        const handle = platform.displayHandle(url);
        const { Icon } = platform;

        return (
          <a
            key={platform.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1 transition-all duration-150 no-underline"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {/* Icon */}
            <span
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
              style={{
                color: "rgba(255,255,255,0.50)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <Icon />
            </span>

            {/* Handle / label — truncated */}
            <span
              className="flex-1 min-w-0 text-[12px] font-medium truncate"
              style={{ color: "rgba(255,255,255,0.60)" }}
            >
              {handle}
            </span>

            {/* External arrow — appears on hover */}
            <span
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              <ExternalLinkIcon size={10} />
            </span>
          </a>
        );
      })}
    </motion.div>
  );
}
