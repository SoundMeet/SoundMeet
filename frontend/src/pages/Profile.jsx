import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { jamService } from "../injectables/jamService";
import { apiService } from "../injectables/apiCalls";
import { postService } from "../injectables/postService";
import CropperThings from "../components/CropperThings";
import { useAuth } from "../injectables/Auth";
import { useAuthModal } from "../context/AuthModalContext";
// ─────────────────────────────────────────────────────────────────────────────

const MAX_SNIPPETS = 5;
const DRAG_DELETE_THRESHOLD = 140;

// ── Card color palette ────────────────────────────────────────────────────────
// Each swatch has a bg (card background), a border tint, and a glow color.
// Text color (dark vs light) is auto-derived from luminance — same logic
// already used for the banner name/location text.
const CARD_COLORS = [
  { label: "Dark",        bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)", glow: "rgba(0,0,0,1)" },
  { label: "Midnight",    bg: "#0d1117",               border: "rgba(255,255,255,0.08)", glow: "rgba(0,0,0,0.8)" },
  { label: "Deep Purple", bg: "#1a0a2e",               border: "#7c3aed44",              glow: "#7c3aed33" },
  { label: "Forest",      bg: "#0a1f0a",               border: "#16a34a44",              glow: "#16a34a33" },
  { label: "Navy",        bg: "#050e2a",               border: "#3b82f644",              glow: "#3b82f633" },
  { label: "Crimson",     bg: "#1f050d",               border: "#dc2e7344",              glow: "#dc2e7333" },
  { label: "Slate",       bg: "#1c1f26",               border: "rgba(255,255,255,0.12)", glow: "rgba(0,0,0,0.9)" },
  { label: "Warm Sand",   bg: "#2a2318",               border: "#ca8a0444",              glow: "#ca8a0433" },
  { label: "Ivory",       bg: "#f5f0e8",               border: "rgba(0,0,0,0.10)",       glow: "rgba(0,0,0,0.1)" },
  { label: "Sky",         bg: "#e8f4fd",               border: "#0891b244",              glow: "#0891b222" },
  { label: "Mint",        bg: "#e8fdf4",               border: "#16a34a44",              glow: "#16a34a22" },
  { label: "Blush",       bg: "#fde8f0",               border: "#dc2e7344",              glow: "#dc2e7322" },
];

// Perceived luminance of a hex or rgba bg string → 0–255 (ITU-R BT.601)
// For rgba colours the alpha channel is composited against a dark background
// (page bg ≈ #1a1a1a = 26) so rgba(255,255,255,0.05) correctly reads as dark.
const PAGE_BG_LUMINANCE = 26;
function bgLuminance(bgStr) {
  const hex = bgStr.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  // rgba(r,g,b,a) — composite over dark page bg before measuring luminance
  const rgba = bgStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/i);
  if (rgba) {
    const a = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
    const r = a * +rgba[1] + (1 - a) * PAGE_BG_LUMINANCE;
    const g = a * +rgba[2] + (1 - a) * PAGE_BG_LUMINANCE;
    const b = a * +rgba[3] + (1 - a) * PAGE_BG_LUMINANCE;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return 0; // default → assume dark → light text
}

// Returns true when the card bg is light enough to need dark text.
// Pass override=true/false to bypass auto-detection entirely.
function needsDarkText(bgStr, override = null) {
  if (override !== null) return override;
  return bgLuminance(bgStr) > 140;
}

const DEFAULT_CARD_COLOR = CARD_COLORS[0];

// ── CardColorRow ──────────────────────────────────────────────────────────────
// One compact row: label on the left, inline swatch strip on the right.
// No descriptions, no previews — just label + swatches.
function CardColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-neutral-400 w-28 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {CARD_COLORS.map((c) => {
          const selected = c.label === value.label;
          return (
            <button
              key={c.label}
              onClick={() => onChange(c)}
              title={c.label}
              className="relative rounded-md transition-all duration-150 hover:scale-110"
              style={{
                width: "20px",
                height: "20px",
                background: c.bg.startsWith("rgba") ? "#1c1c1c" : c.bg,
                outline: selected
                  ? "2px solid #fff"
                  : "1px solid rgba(255,255,255,0.15)",
                outlineOffset: selected ? "2px" : "0px",
                boxShadow: selected ? `0 0 6px ${c.glow}` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── PillToggleButton ──────────────────────────────────────────────────────────
// Reusable toggleable pill used inside the picker modal.
function PillToggleButton({ tag, selected, atMax, color, onToggle }) {
  return (
    <button
      disabled={atMax}
      onClick={onToggle}
      className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150"
      style={{
        backgroundColor: selected ? color + "25" : "rgba(255,255,255,0.04)",
        border: selected ? `1px solid ${color}88` : "1px solid rgba(255,255,255,0.08)",
        color: selected ? color : "rgba(255,255,255,0.35)",
        boxShadow: selected ? `0 0 12px ${color}33` : "none",
        opacity: atMax ? 0.3 : 1,
        cursor: atMax ? "not-allowed" : "pointer",
      }}
    >
      {tag.name}
    </button>
  );
}

// ── PILL EMOJI MAP ─────────────────────────────────────────────────────────────
// Maps tag text (lowercased) to an emoji. Falls back to a music note.
const PILL_EMOJI_MAP = {
  // Genres
  jazz: "🎷", rock: "🎸", pop: "🎤", classical: "🎻", hiphop: "🎧",
  "hip hop": "🎧", electronic: "🎛️", blues: "🎵", country: "🤠",
  folk: "🪕", metal: "🤘", punk: "⚡", reggae: "🌴", soul: "❤️‍🔥",
  rnb: "✨", "r&b": "✨", latin: "💃", funk: "🕺", gospel: "🙏",
  ambient: "🌌", indie: "🌿", alternative: "🔀", techno: "🤖",
  house: "🏠", drum: "🥁", bass: "🔊",
  // Instruments
  guitar: "🎸", piano: "🎹", violin: "🎻", drums: "🥁", saxophone: "🎷",
  trumpet: "🎺", cello: "🎻", bass: "🎸", vocals: "🎤", singing: "🎤",
  flute: "🪈", ukulele: "🪕", keyboard: "🎹", synth: "🎛️", harp: "🪗",
  "bass guitar": "🎸", "electric guitar": "🎸", "acoustic guitar": "🪕",
  // Vibes
  chill: "😌", energetic: "⚡", mellow: "🌙", upbeat: "☀️", dark: "🖤",
  romantic: "💕", melancholy: "🌧️", groovy: "🕺", intense: "🔥",
  peaceful: "🕊️", nostalgic: "📼", experimental: "🧪", cinematic: "🎬",
};

function getPillEmoji(text) {
  const lower = (text || "").toLowerCase();
  for (const [key, emoji] of Object.entries(PILL_EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return "🎵";
}

// ── InterestsSidebar ──────────────────────────────────────────────────────────
function InterestsSidebar({ pills, jams, user, city, country, availableToJam, onToggleAvailable, onReorderPills, isOwnProfile, cardColor, textOverride }) {
  const totalJams    = jams.length;
  const liveJams     = jams.filter(j => j.isLive).length;
  const upcomingJams = jams.filter(j => !j.isLive).length;

  const CATEGORIES = [
    { key: "g", label: "Genres" },
    { key: "i", label: "Instruments" },
    { key: "v", label: "Vibes" },
  ];

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    pills: pills.filter(p => typeof p.id === "string" && p.id.startsWith(cat.key + "_")),
  })).filter(cat => cat.pills.length > 0);

  const ungrouped = pills.filter(p => !CATEGORIES.some(cat => typeof p.id === "string" && p.id.startsWith(cat.key + "_")));

  const dark          = needsDarkText(cardColor.bg, textOverride);
  const textPrimary   = dark ? "#111"             : "#fff";
  const textSecondary = dark ? "#444"             : "#d4d4d4";
  const textDim       = dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";
  const dividerColor  = dark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.18)";
  const tileBg        = dark ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)";
  const tileBorder    = dark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";

  const locationStr = [city, country].filter(Boolean).join(", ");
  const joinedRaw   = user?.date_joined ?? user?.created_at ?? user?.joined_at ?? null;
  const memberSince = joinedRaw
    ? new Date(joinedRaw).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  // ── Per-category drag state ──────────────────────────────────────────────
  const [dragState, setDragState] = useState(null);
  const dragStartY    = useRef(0);
  const movedRef      = useRef(false);
  const containerRefs = useRef({});

  const handlePillDown = (e, catKey, localIdx) => {
    if (!isOwnProfile || !onReorderPills) return;
    e.preventDefault();
    dragStartY.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    movedRef.current   = false;
    setDragState({ catKey, fromIdx: localIdx, overIdx: localIdx });
  };

  useEffect(() => {
    if (!dragState) return;
    const onMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      if (Math.abs(clientY - dragStartY.current) > 5) movedRef.current = true;
      const container = containerRefs.current[dragState.catKey];
      if (!container) return;
      const items = container.querySelectorAll("[data-pill-item]");
      let closest = dragState.overIdx;
      let closestDist = Infinity;
      items.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(clientY - (rect.top + rect.height / 2));
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      setDragState(prev => prev ? { ...prev, overIdx: closest } : null);
    };
    const onUp = () => {
      if (movedRef.current && dragState && dragState.fromIdx !== dragState.overIdx) {
        const catPills   = pills.filter(p => typeof p.id === "string" && p.id.startsWith(dragState.catKey + "_"));
        const reordered  = [...catPills];
        const [moved]    = reordered.splice(dragState.fromIdx, 1);
        reordered.splice(dragState.overIdx, 0, moved);
        let reorderedCopy = [...reordered];
        const newPills = pills.map(p => {
          if (typeof p.id === "string" && p.id.startsWith(dragState.catKey + "_")) {
            return reorderedCopy.shift();
          }
          return p;
        });
        onReorderPills(newPills);
      }
      setDragState(null);
      movedRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, [dragState, pills, onReorderPills]);

  const SectionDivider = () => (
    <div style={{ height: "1px", background: dividerColor, margin: "0 20px" }} />
  );
  const SectionHeading = ({ children }) => (
    <h2 className="text-2xl" style={{ color: textPrimary, transition: "color 0.4s ease" }}>{children}</h2>
  );
  const Tile = ({ left, right, accent }) => (
    <div className="flex items-center justify-between rounded-xl px-3 py-2"
      style={{ background: accent ? "rgba(220,46,115,0.08)" : tileBg, border: `1px solid ${accent ? "rgba(220,46,115,0.15)" : tileBorder}` }}>
      <span className="text-sm" style={{ color: textSecondary }}>{left}</span>
      <span className="text-sm font-bold" style={{ color: accent ? "#DC2E73" : textPrimary }}>{right}</span>
    </div>
  );

  return (
    <div className="w-[210px] shrink-0 flex flex-col">
      <div className="rounded-2xl overflow-hidden backdrop-blur-md flex flex-col flex-1"
        style={{
          background: cardColor.bg, border: `1px solid ${cardColor.border}`,
          boxShadow: `0 0 40px ${cardColor.glow}`, minHeight: "1295px",
          transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >

        {/* ── INTERESTS ── */}
        <div className="p-5 flex flex-col gap-3">
          <SectionHeading>Interests</SectionHeading>

          {/* Sound chips — color pulled from the pill itself */}
          {pills.length > 0 && (() => {
            const chips = ["g", "i", "v"].map(key => {
              const match = pills.find(p => typeof p.id === "string" && p.id.startsWith(key + "_"));
              return match ? { key, color: match.color, text: match.text, emoji: getPillEmoji(match.text) } : null;
            }).filter(Boolean);
            if (chips.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5">
                {chips.map(chip => (
                  <span key={chip.key} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                    style={{ background: chip.color + "18", border: `1px solid ${chip.color}35`, color: chip.color }}>
                    <span style={{ fontSize: "11px" }}>{chip.emoji}</span>
                    <span className="truncate" style={{ maxWidth: "72px" }}>{chip.text}</span>
                  </span>
                ))}
              </div>
            );
          })()}

          {pills.length === 0 ? (
            <p className="text-sm" style={{ color: textSecondary }}>No interests added yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {grouped.map((cat, catIdx) => {
                const isVibes = cat.key === "v";
                return (
                  <div key={cat.key} className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: textSecondary, transition: "color 0.4s ease" }}>
                      {cat.label}
                    </span>
                    <div ref={el => { containerRefs.current[cat.key] = el; }} className="flex flex-col gap-1.5">
                      {cat.pills.map((pill, localIdx) => {
                        const isDragging = dragState?.catKey === cat.key && dragState.fromIdx === localIdx;
                        const isOver     = dragState?.catKey === cat.key && dragState.overIdx === localIdx && dragState.fromIdx !== localIdx;
                        const isTopVibe  = isVibes && localIdx < 3;
                        return (
                          <div key={pill.id ?? localIdx} data-pill-item
                            style={{
                              transition: dragState?.catKey === cat.key && !isDragging ? "transform 0.15s ease" : "none",
                              transform: isOver ? (dragState.fromIdx < localIdx ? "translateY(4px)" : "translateY(-4px)") : "none",
                              opacity: isDragging ? 0.35 : 1,
                            }}
                          >
                            <div
                              onMouseDown={e => handlePillDown(e, cat.key, localIdx)}
                              onTouchStart={e => handlePillDown(e.touches[0], cat.key, localIdx)}
                            className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${isOwnProfile ? "cursor-grab active:cursor-grabbing" : ""}`}
                              style={{
                                background: pill.color + "12", border: `1px solid ${pill.color}28`,
                                boxShadow: isDragging ? `0 0 14px ${pill.color}44` : "none",
                                transition: "box-shadow 0.15s ease",
                              }}
                            >
                              <span className="shrink-0 flex items-center justify-center rounded-lg"
                                style={{ width: "26px", height: "26px", background: pill.color + "20", border: `1px solid ${pill.color}38`, fontSize: "13px" }}>
                                {getPillEmoji(pill.text)}
                              </span>
                              <span className="flex-1 text-xs font-medium truncate" style={{ color: pill.color }}>
                                {pill.text}
                              </span>
                              {isTopVibe && (
                                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: pill.color + "22", border: `1px solid ${pill.color}40`, color: pill.color, letterSpacing: "0.02em" }}>
                                  ★
                                </span>
                              )}
                              {isOwnProfile && (
                                <svg width="7" height="11" viewBox="0 0 7 11" fill="none" style={{ opacity: 0.22, flexShrink: 0, color: textPrimary }}>
                                  <circle cx="1.5" cy="1.5" r="1.1" fill="currentColor"/>
                                  <circle cx="5.5" cy="1.5" r="1.1" fill="currentColor"/>
                                  <circle cx="1.5" cy="5.5" r="1.1" fill="currentColor"/>
                                  <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor"/>
                                  <circle cx="1.5" cy="9.5" r="1.1" fill="currentColor"/>
                                  <circle cx="5.5" cy="9.5" r="1.1" fill="currentColor"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {isVibes && cat.pills.length > 0 && (
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: textDim }}>
                        ★ Top {Math.min(3, cat.pills.length)} shown as top interests
                      </p>
                    )}
                    {catIdx < grouped.length - 1 && (
                      <div className="mt-0.5" style={{ height: "1px", background: dividerColor }} />
                    )}
                  </div>
                );
              })}
              {ungrouped.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {grouped.length > 0 && <div style={{ height: "1px", background: dividerColor }} />}
                  {ungrouped.map((pill, i) => (
                    <div key={pill.id ?? i} className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                      style={{ background: pill.color + "12", border: `1px solid ${pill.color}28` }}>
                      <span className="shrink-0 flex items-center justify-center rounded-lg"
                        style={{ width: "26px", height: "26px", background: pill.color + "20", border: `1px solid ${pill.color}38`, fontSize: "13px" }}>
                        {getPillEmoji(pill.text)}
                      </span>
                      <span className="flex-1 text-xs font-medium truncate" style={{ color: pill.color }}>{pill.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <SectionDivider />

        {/* ── PROFILE ── */}
        <div className="p-5 flex flex-col gap-3">
          <SectionHeading>Profile</SectionHeading>
          <div className="flex flex-col gap-2">
            {locationStr && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
                <span style={{ fontSize: "13px" }}>📍</span>
                <span className="text-sm truncate" style={{ color: textSecondary }}>{locationStr}</span>
              </div>
            )}
            {memberSince && (
              <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "13px" }}>🗓️</span>
                  <span className="text-sm" style={{ color: textSecondary }}>Joined</span>
                </div>
                <span className="text-sm font-bold" style={{ color: textPrimary }}>{memberSince}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "13px" }}>🎵</span>
                <span className="text-sm" style={{ color: textSecondary }}>Interests</span>
              </div>
              <span className="text-sm font-bold" style={{ color: textPrimary }}>{pills.length}</span>
            </div>
          </div>
        </div>

        <SectionDivider />

        {/* ── STATS ── */}
        <div className="p-5 flex flex-col gap-3">
          <SectionHeading>Stats</SectionHeading>
          <div className="flex flex-col gap-2">
            <Tile left={<><span style={{marginRight:6}}>🎸</span>Total Jams</>}  right={totalJams}    accent={true} />
            <Tile left={<><span style={{marginRight:6}}>🔴</span>Live now</>}    right={liveJams}     accent={false} />
            <Tile left={<><span style={{marginRight:6}}>📅</span>Upcoming</>}    right={upcomingJams} accent={false} />
          </div>
        </div>


      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────

const Profile = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Name & Location");
  const [nameHover, setNameHover] = useState(false);

  // ── Route param — /profile/:username ─────────────────────────────────────
  // If a username is present in the URL we're viewing someone else's profile.
  // If not, we're viewing our own. isOwnProfile gates all edit affordances.
  const { username: routeUsername } = useParams();
  const { user: loggedInUser, isLoggedIn, updateProfile } = useAuth();
  const { openModal } = useAuthModal();

  // viewedUser — the profile being displayed. Starts as the logged-in user,
  // then gets replaced by the fetched profile when viewing someone else.
  const [viewedUser, setViewedUser]       = useState(null);
  const [viewedUserLoading, setViewedUserLoading] = useState(!!routeUsername);

  // Derive isOwnProfile once we know both sides
  const isOwnProfile = !routeUsername || (loggedInUser?.username === routeUsername);

  // The user object we actually seed the profile from
  const user = isOwnProfile ? loggedInUser : viewedUser;

  // Fetch the viewed user when a username param is present and it's not our own
  useEffect(() => {
    if (!routeUsername || isOwnProfile) {
      setViewedUserLoading(false);
      return;
    }
    setViewedUserLoading(true);
    // ── BACKEND: replace this stub with your real user-by-username endpoint ──
    // Expected shape: same as the logged-in `user` object from useAuth.
    // e.g. apiService.getUserByUsername(routeUsername)
    apiService.getUserByUsername(routeUsername)
      .then(data => setViewedUser(data))
      .catch(err => {
        console.error("Failed to load profile:", err);
        setViewedUser(null);
      })
      .finally(() => setViewedUserLoading(false));
  }, [routeUsername, isOwnProfile]);

  // selectedJam holds the jam object the user clicked, or null when the
  // stub is closed. Driving open/closed from data (the jam itself) rather
  // than a separate boolean means the stub always has what it needs to render.
  const [selectedJam, setSelectedJam] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const [profilePic, setProfilePic] = useState(null);
  const [banner,     setBanner]     = useState(null);
  const [about,      setAbout]      = useState("");
  const [headline,   setHeadline]   = useState("");
  const [aboutPhoto, setAboutPhoto] = useState(null);
  const [name,       setName]       = useState("");
  const [location,   setLocation]   = useState("");
  const [city,       setCity]       = useState("");
  const [country,    setCountry]    = useState("");

  // Availability toggle — local state, shown in the Interests sidebar
  const [availableToJam, setAvailableToJam] = useState(false);

  // ── Add Friend state — only relevant when viewing someone else's profile ──
  const [friendStatus, setFriendStatus] = useState("none"); // "none" | "pending" | "friends"
  const [friendLoading, setFriendLoading] = useState(false);

  const handleAddFriend = async () => {
    if (!isLoggedIn) { openModal("login"); return; }
    if (friendLoading || friendStatus !== "none") return;
    setFriendLoading(true);
    try {
      await apiService.sendFriendRequest(user?.id);
      setFriendStatus("pending");
    } catch (err) {
      console.error("Failed to send friend request:", err);
    } finally {
      setFriendLoading(false);
    }
  };

  // pills – seeded from user.genres_liked, instruments_liked, vibes_liked
  const [pills, setPills] = useState([]);

  // ── Pill picker state ─────────────────────────────────────────────────────
  const [allTags, setAllTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [pillPickerOpen, setPillPickerOpen] = useState(false);
  const [pillViewerOpen, setPillViewerOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);

  const PILL_COLORS = ["#DC2E73", "#7C3AED", "#0891B2", "#EA580C", "#16A34A", "#CA8A04"];
  const MAX_PILLS = 12;

  // Toggle a tag in the picker — single source of truth, rebuilds pills from selection
  const toggleTag = (tag) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.uid)) {
        next.delete(tag.uid);
      } else {
        if (next.size >= MAX_PILLS) return prev;
        next.add(tag.uid);
      }
      const newPills = allTags
        .filter((t) => next.has(t.uid))
        .map((t) => ({
          id: t.uid,
          text: t.name,
          color: PILL_COLORS[t.id % PILL_COLORS.length],
        }));
      setPills(newPills);
      return next;
    });
  };

  // Seed local state from the authenticated user object whenever it resolves.
  // city + country are joined into "City, Country" format matching the location field.
  useEffect(() => {
    if (!user) return;
    setName(user.display_name || user.username || "");
    const parts = [user.city, user.country].filter(Boolean);
    setLocation(parts.join(", "));
    setCity(user.city || "");
    setCountry(user.country || "");
    setAbout(user.about || "");
    setHeadline(user.headline || "");
    setAvailableToJam(user.available_to_jam ?? false);
    if (user.pfp) setProfilePic(user.pfp);

    // Seed pills from genres, instruments, and vibes — color stable per tag.id
    const colors = ["#DC2E73", "#7C3AED", "#0891B2", "#EA580C", "#16A34A", "#CA8A04"];
    const userTags = [
      ...(user.genres_liked ?? []).map(t => ({ ...t, uid: `g_${t.id}` })),
      ...(user.instruments_liked ?? []).map(t => ({ ...t, uid: `i_${t.id}` })),
      ...(user.vibes_liked ?? []).map(t => ({ ...t, uid: `v_${t.id}` })),
    ];
    if (userTags.length > 0) {
      setPills(userTags.map((tag) => ({
        id: tag.uid,
        text: tag.name,
        color: colors[tag.id % colors.length],
      })));
      setSelectedTagIds(new Set(userTags.map((t) => t.uid)));
    }

    // Seed visual theme from stored profile_theme JSON if the backend provides it.
    // profile_theme shape: { cardColors, jamCardColor, cardTextOverrides, bannerDark }
    if (user.profile_theme) {
      try {
        const theme = typeof user.profile_theme === "string"
          ? JSON.parse(user.profile_theme)
          : user.profile_theme;
        if (theme.cardColors)       setCardColors(prev => ({ ...prev, ...theme.cardColors }));
        if (theme.jamCardColor)     setJamCardColor(theme.jamCardColor);
        if (theme.cardTextOverrides) setCardTextOverrides(prev => ({ ...prev, ...theme.cardTextOverrides }));
        if (typeof theme.bannerDark === "boolean") setBannerDark(theme.bannerDark);
      } catch (e) {
        console.warn("Failed to parse profile_theme:", e);
      }
    }
  }, [user]);

  // bannerDark – true when the banner image is dark enough that text
  // should be white. Auto-detected from pixel sampling in saveCroppedBanner,
  // but can be overridden manually with the toggle in the Banner edit section.
  const [bannerDark, setBannerDark] = useState(false);

  // cardColors – per-card colour theme. Defaults to the first CARD_COLORS swatch.
  // Each value is a full swatch object { label, bg, border, glow }.
  const [cardColors, setCardColors] = useState({
    aboutMe:    DEFAULT_CARD_COLOR,
    musicSnips: DEFAULT_CARD_COLOR,
    jams:       DEFAULT_CARD_COLOR,
    posts:      DEFAULT_CARD_COLOR,
    interests:  DEFAULT_CARD_COLOR,
  });
  const setCardColor = (card, color) =>
    setCardColors((prev) => ({ ...prev, [card]: color }));

  // jamCardColor — background swatch for the individual jam row cards inside the Jams container
  const [jamCardColor, setJamCardColor] = useState(CARD_COLORS[0]);

  // cardTextOverrides – manual light/dark text override per card.
  // null = auto-detect from luminance. true = force dark text. false = force light text.
  const [cardTextOverrides, setCardTextOverrides] = useState({
    aboutMe:    null,
    musicSnips: null,
    jams:       null,
    posts:      null,
    interests:  null,
  });
  const toggleCardTextOverride = (card, autoDark) => {
    setCardTextOverrides((prev) => {
      if (prev[card] === null) return { ...prev, [card]: !autoDark };
      return { ...prev, [card]: null };
    });
  };

  const [globalTextOverride, setGlobalTextOverride] = useState(null);
  const setGlobalText = (val) => {
    setGlobalTextOverride(val);
    setCardTextOverrides({ aboutMe: val, musicSnips: val, jams: val, posts: val, interests: val });
  };

  // toast – transient notification string, null when hidden.
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const [snippets, setSnippets] = useState([]);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    title: "",
    audioFile: null,  // raw File object — blob URL created at play time
    audioName: null,
    background: null,
  });

  const [playingIndex, setPlayingIndex] = useState(null);
  const [pulse, setPulse] = useState({});

  // ── Unified crop state — one CropperThings modal handles all image uploaders
  const [cropState, setCropState] = useState({ open: false, variant: "square", rawImage: null });

  const openCrop = (variant, file) => {
    if (!file) return;
    setCropState({ open: true, variant, rawImage: URL.createObjectURL(file) });
  };

  const closeCrop = () => {
    if (cropState.rawImage) URL.revokeObjectURL(cropState.rawImage);
    setCropState({ open: false, variant: "square", rawImage: null });
  };

  const [dragging, setDragging] = useState(null);
  const [dragX, setDragX] = useState(0);

  // ── Jam drag state — kept separate from snippet drag so the two
  // interactions can never interfere with each other. Same shape,
  // same pattern, just prefixed with "jam".
  const [jamDragging, setJamDragging]   = useState(null);
  const [jamDragX,    setJamDragX]      = useState(0);
  const jamDragStartXRef                = useRef(0);
  const jamLastDragXRef                 = useRef(0);
  const jamMovedRef                     = useRef(false);

  // ── Posts state ───────────────────────────────────────────────────────────
  const audioRef = useRef(null);

  const dragStartXRef = useRef(0);
  const lastDragXRef = useRef(0);
  const movedRef = useRef(false);

  // ── Jams state — fetched from jamService, capped at 9, local-only removal ──
  const [jams, setJams] = useState([]);
  const [jamsLoading, setJamsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setJamsLoading(true);
    Promise.all([
      jamService.getMyAttendingJams(user.id, null),
      jamService.getMyCreatedJams(user.id, null),
    ])
      .then(([attending, created]) => {
        const seen = new Set();
        const merged = [...attending, ...created].filter((j) => {
          if (seen.has(j.id)) return false;
          seen.add(j.id);
          return true; // keep past jams — they render greyed
        });
        const order = { live: 0, tonight: 1, tomorrow: 2, week: 3, future: 4, past: 5 };
        merged.sort((a, b) => (order[a.timeSlot] ?? 5) - (order[b.timeSlot] ?? 5));
        setJams(merged.slice(0, 9));
      })
      .catch(console.error)
      .finally(() => setJamsLoading(false));
  }, [user?.id]);

  const removeJam = (jamId) => setJams((prev) => prev.filter((j) => j.id !== jamId));

  // ── Profile posts — up to 3 most recent ──────────────────────────────────────
  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePostsLoading, setProfilePostsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setProfilePostsLoading(true);
    postService.getPostsByUser(user.id, loggedInUser?.id, 5)
      .then(setProfilePosts)
      .catch(console.error)
      .finally(() => setProfilePostsLoading(false));
  }, [user?.id, loggedInUser?.id]);

  const revokeObjectUrl = (url) => {
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingIndex(null);
  };

  // ── BACKEND NEEDED: fetch snippets on mount ───────────────────────────────
  // Uncomment and replace stub once GET /api/snippets/ (or /api/profiles/<username>/snippets/) exists.
  // Shape expected per snippet: { id, title, audio: <served URL>, background: <served URL or null> }
  //
  // useEffect(() => {
  //   if (!user?.id) return;
  //   const endpoint = isOwnProfile ? "api/snippets/" : `api/profiles/${routeUsername}/snippets/`;
  //   apiFetch(endpoint)
  //     .then((data) => setSnippets(data.map(s => ({ ...s, audioFile: null, audioName: s.title }))))
  //     .catch(console.error);
  // }, [user?.id, isOwnProfile, routeUsername]);

  const saveSnippet = async () => {
    if (!newSnippet.title.trim() && !newSnippet.audioFile) {
      showToast("Please add a title and audio file.");
      return;
    }
    if (!newSnippet.title.trim()) {
      showToast("Your snippet needs a title.");
      return;
    }
    if (!newSnippet.audioFile) {
      showToast("Please upload an audio file.");
      return;
    }
    if (snippets.length >= MAX_SNIPPETS) {
      showToast(`Maximum ${MAX_SNIPPETS} snippets reached.`);
      return;
    }

    // ── BACKEND NEEDED: POST /api/snippets/ ─────────────────────────────────
    // Uncomment once the endpoint exists. Remove the local blob fallback below.
    //
    // try {
    //   const form = new FormData();
    //   form.append("title", newSnippet.title);
    //   form.append("audio", newSnippet.audioFile);
    //   if (newSnippet.background) {
    //     const bgBlob = await fetch(newSnippet.background).then(r => r.blob());
    //     form.append("background", bgBlob, "bg.jpg");
    //   }
    //   const saved = await apiFetch("api/snippets/", { method: "POST", body: form });
    //   setSnippets((prev) => [...prev, { ...saved, audioFile: null, audioName: saved.title }]);
    // } catch (err) {
    //   showToast("Failed to save snippet.");
    //   return;
    // }

    // ── LOCAL FALLBACK (remove once backend is wired) ────────────────────────
    const audioUrl = URL.createObjectURL(newSnippet.audioFile);
    setSnippets((prev) => [...prev, { ...newSnippet, audio: audioUrl }]);
    // ─────────────────────────────────────────────────────────────────────────

    setNewSnippet({ title: "", audioFile: null, audioName: null, background: null });
    setSnippetModalOpen(false);
  };

  const deleteSnippet = async (indexToDelete) => {
    const target = snippets[indexToDelete];

    // ── BACKEND NEEDED: DELETE /api/snippets/<id>/ ───────────────────────────
    // Uncomment once the endpoint exists.
    //
    // if (target?.id) {
    //   try {
    //     await apiFetch(`api/snippets/${target.id}/`, { method: "DELETE" });
    //   } catch (err) {
    //     showToast("Failed to delete snippet.");
    //     return;
    //   }
    // }

    // ── LOCAL CLEANUP ────────────────────────────────────────────────────────
    if (target) {
      revokeObjectUrl(target.audio);
      revokeObjectUrl(target.background);
    }
    setSnippets((prev) => prev.filter((_, i) => i !== indexToDelete));

    if (playingIndex === indexToDelete) {
      stopPlayback();
    } else if (playingIndex !== null && playingIndex > indexToDelete) {
      setPlayingIndex((prev) => (prev === null ? null : prev - 1));
    }
  };

  const triggerPulse = (index) => {
    setPulse((prev) => ({ ...prev, [index]: Date.now() }));
  };

  const playSnippet = (snippet, index) => {
    if (playingIndex === index) {
      stopPlayback();
      return;
    }

    stopPlayback();

    try {
      const audio = new Audio(snippet.audio);
      audioRef.current = audio;

      // play() is called synchronously within the click handler —
      // no awaits before this point so the browser gesture trust window is intact.
      const playPromise = audio.play();
      triggerPulse(index);
      setPlayingIndex(index);

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.onended = () => stopPlayback();
          })
          .catch((error) => {
            console.error("Audio playback failed:", error);
            stopPlayback();
          });
      } else {
        audio.onended = () => stopPlayback();
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      stopPlayback();
    }
  };

  const getClientX = (event) => {
    if (event.touches && event.touches[0]) return event.touches[0].clientX;
    if (event.changedTouches && event.changedTouches[0]) {
      return event.changedTouches[0].clientX;
    }
    return event.clientX;
  };

  const handleDragStart = (index, event) => {
    dragStartXRef.current = getClientX(event);
    lastDragXRef.current = 0;
    movedRef.current = false;
    setDragging(index);
    setDragX(0);
  };

  const handleDragMove = (event) => {
    if (dragging === null) return;

    const currentX = getClientX(event);
    const distance = currentX - dragStartXRef.current;

    if (Math.abs(distance) > 6) {
      movedRef.current = true;
    }

    lastDragXRef.current = distance;
    setDragX(distance);
  };

  const handleDragEnd = () => {
    if (dragging === null) return;

    const draggedIndex = dragging;
    const finalDistance = lastDragXRef.current;

    setDragging(null);
    setDragX(0);

    if (Math.abs(finalDistance) >= DRAG_DELETE_THRESHOLD) {
      deleteSnippet(draggedIndex);
    }
  };

  useEffect(() => {
    if (dragging === null) return;

    const onMouseMove = (event) => handleDragMove(event);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (event) => handleDragMove(event);
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging]);

  // ── Jam drag handlers ────────────────────────────────────────────────────
  // Identical structure to the snippet drag handlers above.
  // Using jam.id (not array index) to identify the card being dragged —
  // safer because the jams array can shift (prepend/delete) between renders.

  const handleJamDragStart = (jamId, event) => {
    jamDragStartXRef.current = getClientX(event);
    jamLastDragXRef.current  = 0;
    jamMovedRef.current      = false;
    setJamDragging(jamId);
    setJamDragX(0);
  };

  const handleJamDragMove = (event) => {
    if (jamDragging === null) return;
    const distance = getClientX(event) - jamDragStartXRef.current;
    if (Math.abs(distance) > 6) jamMovedRef.current = true;
    jamLastDragXRef.current = distance;
    setJamDragX(distance);
  };

  const handleJamDragEnd = () => {
    if (jamDragging === null) return;
    const jamId       = jamDragging;
    const finalDist   = jamLastDragXRef.current;
    setJamDragging(null);
    setJamDragX(0);
    if (Math.abs(finalDist) >= DRAG_DELETE_THRESHOLD) {
      // If the stub is open for the card being deleted, close it first
      // so we don't show a modal for a jam that no longer exists.
      if (selectedJam?.id === jamId) setSelectedJam(null);
      removeJam(jamId);
    }
  };

  useEffect(() => {
    if (jamDragging === null) return;

    const onMouseMove = (e) => handleJamDragMove(e);
    const onMouseUp   = ()  => handleJamDragEnd();
    const onTouchMove = (e) => handleJamDragMove(e);
    const onTouchEnd  = ()  => handleJamDragEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend",  onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onTouchEnd);
    };
  }, [jamDragging]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (cropState.rawImage) URL.revokeObjectURL(cropState.rawImage);

      snippets.forEach((snippet) => {
        revokeObjectUrl(snippet.audio);
        revokeObjectUrl(snippet.background);
      });

      revokeObjectUrl(newSnippet.background);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sectionButtons = [
    "Name & Location",
    "Profile Picture",
    "Banner",
    "About Me",
    "Pills",
    "Card Colors",
  ];

  // Lock body scroll whenever any modal is open so the page can't scroll behind it.
  const anyModalOpen = editOpen || snippetModalOpen || pillPickerOpen || pillViewerOpen || !!selectedJam;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [anyModalOpen]);

  // Show a spinner while fetching another user's profile
  if (viewedUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900/50">
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    );
  }

  // If we tried to load a user by username and got nothing, show a 404-style message
  if (routeUsername && !isOwnProfile && !viewedUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-900/50 text-white">
        <p className="text-2xl font-semibold">Profile not found</p>
        <p className="text-sm text-white/40">No user with username @{routeUsername}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900/50 backdrop-blur-2xl text-white flex flex-col">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6">

        {/* ── Top-level layout: [content area] + [jams sidebar] ── */}
        <div className="flex gap-4 items-start">

          {/* ── LEFT+CENTER CONTENT AREA ── */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">

            {/* Banner — scoped to left+center only, sidebar breaks through above it */}
            <div
              className="relative flex h-[260px] w-full items-center overflow-visible rounded-2xl bg-neutral-200 px-6 md:px-10"
              onMouseEnter={() => setNameHover(true)}
              onMouseLeave={() => setNameHover(false)}
              style={{
                backgroundImage: banner ? `url(${banner})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: (() => {
                  const allGlows = [
                    cardColors.aboutMe.glow,
                    cardColors.musicSnips.glow,
                    cardColors.jams.glow,
                    cardColors.posts.glow,
                    cardColors.interests.glow,
                  ];
                  const colored = allGlows.filter(g =>
                    !g.startsWith("rgba(0,0,0") && !g.startsWith("rgba(0, 0, 0")
                  );
                  const freq = {};
                  colored.forEach(g => { freq[g] = (freq[g] || 0) + 1; });
                  const dominant = colored.sort((a, b) => (freq[b] || 0) - (freq[a] || 0))[0]
                    ?? "rgba(220,46,115,0.6)";
                  return `0 0 20px ${dominant}, 0 10px 40px rgba(0,0,0,0.8)`;
                })(),
                transition: "box-shadow 0.4s ease",
              }}
            >
              {isOwnProfile && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute inset-0 z-30 cursor-pointer opacity-0"
                  aria-label="Open profile editor"
                />
              )}

              {/* ── Add Friend button — only visible on other people's profiles, hidden when edit modal is open ── */}
              {!isOwnProfile && !editOpen && (
                <button
                  onClick={handleAddFriend}
                  disabled={friendLoading || friendStatus !== "none"}
                  className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: friendStatus === "friends"
                      ? "rgba(22,163,74,0.15)"
                      : friendStatus === "pending"
                        ? "rgba(255,255,255,0.10)"
                        : "#DC2E73",
                    border: friendStatus === "friends"
                      ? "1px solid rgba(22,163,74,0.4)"
                      : friendStatus === "pending"
                        ? "1px solid rgba(255,255,255,0.2)"
                        : "1px solid rgba(220,46,115,0.6)",
                    color: friendStatus === "friends"
                      ? "#4ade80"
                      : friendStatus === "pending"
                        ? "rgba(255,255,255,0.5)"
                        : "#fff",
                    boxShadow: friendStatus === "none" ? "0 0 20px rgba(220,46,115,0.35)" : "none",
                    opacity: friendLoading ? 0.6 : 1,
                    cursor: friendStatus !== "none" ? "default" : "pointer",
                  }}
                >
                  {friendLoading ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : friendStatus === "friends" ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Friends
                    </>
                  ) : friendStatus === "pending" ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      Request Sent
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
                        <path d="M20 8v3M18.5 9.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      Add Friend
                    </>
                  )}
                </button>
              )}
              <div className="relative z-10 flex items-center">
                <div
                  className="h-[180px] w-[180px] rounded-full border-4 border-white/70 bg-cover bg-center shadow-lg md:h-[210px] md:w-[210px]"
                  style={{
                    backgroundImage: profilePic ? `url(${profilePic})` : undefined,
                    backgroundColor: profilePic ? "transparent" : "#db2777",
                  }}
                />
                <div className="ml-5 md:ml-8">
                  <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-semibold md:text-3xl ${bannerDark ? "text-white" : "text-black"}`}>
                      {name}
                    </h1>
                    {user?.username && (
                      <span className="text-xs" style={{ color: bannerDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>
                        @{user.username}
                      </span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: nameHover ? 1 : 0, transition: "opacity 0.25s ease", flexShrink: 0 }}>
                      <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke={bannerDark ? "white" : "#333"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-sm md:text-base ${bannerDark ? "text-white/80" : "text-neutral-700"}`}>{location}</p>
                    <svg width="11" height="11" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: nameHover ? 1 : 0, transition: "opacity 0.25s ease", flexShrink: 0 }}>
                      <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke={bannerDark ? "rgba(255,255,255,0.7)" : "#555"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Two-column content grid below banner ── */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-4">

            {/* About Me container */}
            <div
              className="h-[500px] rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.aboutMe.bg,
                border: `1px solid ${cardColors.aboutMe.border}`,
                boxShadow: `0 0 40px ${cardColors.aboutMe.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >

              {/* About Me heading + bio + optional rotated photo */}
              <div className="flex flex-1 gap-4 min-h-0">

                {/* Text side */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <h2
                    className="text-2xl shrink-0"
                    style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "#111" : "#fff", transition: "color 0.4s ease" }}
                  >
                    About Me
                  </h2>

                  {/* Headline subsection */}
                  <div className="shrink-0">
                    <p
                      className="text-sm font-semibold mb-0.5"
                      style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "#444" : "#d4d4d4", transition: "color 0.4s ease" }}
                    >
                      Headline
                    </p>
                    {headline ? (
                      <p
                        className="text-sm leading-relaxed break-words"
                        style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "#444" : "#d4d4d4", transition: "color 0.4s ease" }}
                      >
                        {headline}
                      </p>
                    ) : (
                      <p
                        className="text-sm italic"
                        style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)", transition: "color 0.4s ease" }}
                      >
                        Add your headline!
                      </p>
                    )}
                  </div>

                  {/* Divider between headline and bio */}
                  <div className="shrink-0" style={{ height: "1px", background: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)" }} />

                  {about ? (
                    <p
                      className="text-sm leading-relaxed break-words"
                      style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "#444" : "#d4d4d4", transition: "color 0.4s ease" }}
                    >
                      {about}
                    </p>
                  ) : (
                    <p
                      className="text-sm leading-relaxed italic"
                      style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)", transition: "color 0.4s ease" }}
                    >
                      (bio goes here)
                    </p>
                  )}
                </div>

                {/* Rotated photo — only shown when the user has picked one */}
                {aboutPhoto && (
                  <div className="shrink-0 self-center">
                    <div
                      className="w-[120px] h-[150px] rounded-xl overflow-hidden border-4 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
                      style={{
                        transform: "rotate(6deg)",
                        backgroundImage: `url(${aboutPhoto})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Your Music Snips container */}
            <div
              className="h-[500px] rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.musicSnips.bg,
                border: `1px solid ${cardColors.musicSnips.border}`,
                boxShadow: `0 0 40px ${cardColors.musicSnips.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              <div className="flex items-center justify-between shrink-0">
                <h2
                  className="text-2xl"
                  style={{ color: needsDarkText(cardColors.musicSnips.bg, cardTextOverrides.musicSnips) ? "#111" : "#fff", transition: "color 0.4s ease" }}
                >
                  Music Snips
                </h2>
                {isOwnProfile && snippets.length > 0 && snippets.length < MAX_SNIPPETS && (
                  <button
                    onClick={() => setSnippetModalOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-[#D33280] to-[#EA65C2] text-xl text-black transition hover:scale-110 shadow-[0_12px_50px_rgba(60,20,20,0.3)]"
                  >
                    +
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {snippets.length === 0 ? (
                  isOwnProfile ? (
                    <button
                      onClick={() => setSnippetModalOpen(true)}
                      className="rounded-2xl border border-dashed border-neutral-600 bg-neutral-800 py-8 text-center text-neutral-400 transition hover:bg-neutral-700"
                    >
                      Add your first snippet
                    </button>
                  ) : (
                    <p className="text-center py-8 text-sm text-neutral-600">No snippets yet.</p>
                  )
                ) : (
                  snippets.map((snippet, index) => {
                    const isDragging = dragging === index;
                    const offsetX = isDragging ? dragX : 0;
                    const dragProgress = Math.min(Math.abs(offsetX) / DRAG_DELETE_THRESHOLD, 1);

                    return (
                      <div key={index} className="relative group/snip">
                        {/* Hover tooltip — visible only when idle (not dragging, not playing) */}
                        {!isDragging && playingIndex !== index && (
                          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30
                            opacity-0 group-hover/snip:opacity-100 transition-opacity duration-200
                            bg-neutral-800 text-white text-[11px] px-3 py-1 whitespace-nowrap"
                            style={{ borderRadius: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                          >
                            {playingIndex === index ? "Click to pause" : "Click to play · Drag to delete"}
                          </div>
                        )}
                        {/* Ping ring — lives inside the card wrapper so it scrolls with it */}
                        {playingIndex === index && pulse[index] && (
                          <div
                            key={pulse[index]}
                            className="animate-ping pointer-events-none absolute inset-0 rounded-full border border-white/70 z-20"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
                          {isDragging && (
                            <div className="absolute inset-0 rounded-full bg-red-500/15" />
                          )}
                          {isDragging && dragProgress > 0.45 && (
                            <div className="absolute right-5 text-sm font-medium text-red-300">
                              Release to delete
                            </div>
                          )}
                        </div>
                        <div
                          onMouseDown={(e) => handleDragStart(index, e)}
                          onTouchStart={(e) => handleDragStart(index, e)}
                          onClick={(e) => {
                            if (!movedRef.current) {
                              playSnippet(snippet, index);
                            }
                            movedRef.current = false;
                          }}
                          className="relative z-10 flex cursor-pointer items-center justify-between rounded-full bg-neutral-700 px-6 py-4 text-white transition"
                          style={{
                            // scale(1.04) on the playing card is purely visual via transform —
                            // it never affects document flow so siblings never shift.
                            transform: `translateX(${offsetX}px) rotate(${offsetX * 0.04}deg) scale(${playingIndex === index && !isDragging ? 1.04 : 1})`,
                            opacity: isDragging ? 1 - Math.abs(offsetX) / 320 : 1,
                            transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease",
                            backgroundImage: snippet.background
                              ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${snippet.background})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <span
                            className="pr-4 min-w-0"
                            style={{
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              maskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                              WebkitMaskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                            }}
                          >{snippet.title}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-white/70">
                              <div className={`h-2 w-2 rounded-full bg-white ${playingIndex === index ? "animate-pulse" : ""}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>{/* end LEFT COLUMN */}

          {/* ── RIGHT COLUMN — Interests + Posts ── */}
          <div className="flex flex-col gap-4">

            {/* Interests card — full drag+drop with favorites chips */}
            {(() => {
              const dark          = needsDarkText(cardColors.interests.bg, cardTextOverrides.interests);
              const textPrimary   = dark ? "#111"             : "#fff";
              const textSecondary = dark ? "#444"             : "#d4d4d4";
              const textDim       = dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";
              const dividerCol    = dark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.18)";
              const tileBg        = dark ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)";
              const tileBorder    = dark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";

              const CATEGORIES = [
                { key: "g", label: "Genres" },
                { key: "i", label: "Instruments" },
                { key: "v", label: "Vibes" },
              ];
              const grouped = CATEGORIES.map(cat => ({
                ...cat,
                pills: pills.filter(p => typeof p.id === "string" && p.id.startsWith(cat.key + "_")),
              })).filter(cat => cat.pills.length > 0);
              const ungrouped = pills.filter(p => !CATEGORIES.some(cat => typeof p.id === "string" && p.id.startsWith(cat.key + "_")));

              // Per-category drag state — inline mirror of InterestsSidebar logic
              const [intDragState, setIntDragState] = useState(null);
              const intDragStartY    = useRef(0);
              const intMovedRef      = useRef(false);
              const intContainerRefs = useRef({});

              const handleIntPillDown = (e, catKey, localIdx) => {
                if (!isOwnProfile) return;
                e.preventDefault();
                intDragStartY.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
                intMovedRef.current   = false;
                setIntDragState({ catKey, fromIdx: localIdx, overIdx: localIdx });
              };

              useEffect(() => {
                if (!intDragState) return;
                const onMove = (e) => {
                  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                  if (Math.abs(clientY - intDragStartY.current) > 5) intMovedRef.current = true;
                  const container = intContainerRefs.current[intDragState.catKey];
                  if (!container) return;
                  const items = container.querySelectorAll("[data-pill-item]");
                  let closest = intDragState.overIdx, closestDist = Infinity;
                  items.forEach((el, i) => {
                    const rect = el.getBoundingClientRect();
                    const dist = Math.abs(clientY - (rect.top + rect.height / 2));
                    if (dist < closestDist) { closestDist = dist; closest = i; }
                  });
                  setIntDragState(prev => prev ? { ...prev, overIdx: closest } : null);
                };
                const onUp = () => {
                  if (intMovedRef.current && intDragState && intDragState.fromIdx !== intDragState.overIdx) {
                    const catPills  = pills.filter(p => typeof p.id === "string" && p.id.startsWith(intDragState.catKey + "_"));
                    const reordered = [...catPills];
                    const [moved]   = reordered.splice(intDragState.fromIdx, 1);
                    reordered.splice(intDragState.overIdx, 0, moved);
                    let copy = [...reordered];
                    const newPills = pills.map(p => {
                      if (typeof p.id === "string" && p.id.startsWith(intDragState.catKey + "_")) return copy.shift();
                      return p;
                    });
                    setPills(newPills);
                  }
                  setIntDragState(null);
                  intMovedRef.current = false;
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup",   onUp);
                window.addEventListener("touchmove", onMove, { passive: false });
                window.addEventListener("touchend",  onUp);
                return () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup",   onUp);
                  window.removeEventListener("touchmove", onMove);
                  window.removeEventListener("touchend",  onUp);
                };
              }, [intDragState, pills]);

              return (
                <div
                  className="relative h-[500px] rounded-2xl p-5 backdrop-blur-md flex flex-col gap-3"
                  style={{
                    background: cardColors.interests.bg,
                    border: `1px solid ${cardColors.interests.border}`,
                    boxShadow: `0 0 40px ${cardColors.interests.glow}`,
                    transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                  }}
                >
                  <h2 className="text-2xl shrink-0" style={{ color: textPrimary, transition: "color 0.4s ease" }}>Interests</h2>

                  {/* ── Availability toggle — top-right corner ── */}
                  {isOwnProfile ? (
                    <button
                      onClick={() => setAvailableToJam(v => !v)}
                      className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all duration-200"
                      style={{
                        background: availableToJam ? "rgba(220,46,115,0.12)" : tileBg,
                        border: `1px solid ${availableToJam ? "rgba(220,46,115,0.35)" : tileBorder}`,
                      }}
                    >
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {availableToJam && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#DC2E73" }} />}
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: availableToJam ? "#DC2E73" : (dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)") }} />
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: availableToJam ? "#DC2E73" : textDim }}>
                        {availableToJam ? "Open to Jam" : "Not Available"}
                      </span>
                    </button>
                  ) : (
                    <div
                      className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
                      style={{
                        background: availableToJam ? "rgba(220,46,115,0.08)" : tileBg,
                        border: `1px solid ${availableToJam ? "rgba(220,46,115,0.25)" : tileBorder}`,
                      }}
                    >
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {availableToJam && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#DC2E73" }} />}
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: availableToJam ? "#DC2E73" : (dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)") }} />
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: availableToJam ? "#DC2E73" : textDim }}>
                        {availableToJam ? "Open to Jam" : "Not Available"}
                      </span>
                    </div>
                  )}

                  {/* Favorites chips — first pill per category, color pulled from the pill itself */}
                  {pills.length > 0 && (() => {
                    const chips = ["g", "i", "v"].map(key => {
                      const match = pills.find(p => typeof p.id === "string" && p.id.startsWith(key + "_"));
                      return match ? { key, color: match.color, text: match.text, emoji: getPillEmoji(match.text) } : null;
                    }).filter(Boolean);
                    if (chips.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {chips.map(chip => (
                          <span key={chip.key} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                            style={{ background: chip.color + "18", border: `1px solid ${chip.color}35`, color: chip.color }}>
                            <span style={{ fontSize: "11px" }}>{chip.emoji}</span>
                            <span className="truncate" style={{ maxWidth: "90px" }}>{chip.text}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Pill list — scrollable, drag-to-reorder */}
                  <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
                    {pills.length === 0 ? (
                      <p className="text-sm" style={{ color: textSecondary }}>No interests added yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {grouped.map((cat, catIdx) => {
                          const isVibes = cat.key === "v";
                          return (
                            <div key={cat.key} className="flex flex-col gap-1.5">
                              <span className="text-sm font-semibold" style={{ color: textSecondary, transition: "color 0.4s ease" }}>
                                {cat.label}
                              </span>
                              <div ref={el => { intContainerRefs.current[cat.key] = el; }} className="flex flex-col gap-1.5">
                                {cat.pills.map((pill, localIdx) => {
                                  const isDragging = intDragState?.catKey === cat.key && intDragState.fromIdx === localIdx;
                                  const isOver     = intDragState?.catKey === cat.key && intDragState.overIdx === localIdx && intDragState.fromIdx !== localIdx;
                                  const isTop      = localIdx < 3;
                                  return (
                                    <div key={pill.id ?? localIdx} data-pill-item
                                      style={{
                                        transition: intDragState?.catKey === cat.key && !isDragging ? "transform 0.15s ease" : "none",
                                        transform: isOver ? (intDragState.fromIdx < localIdx ? "translateY(4px)" : "translateY(-4px)") : "none",
                                        opacity: isDragging ? 0.35 : 1,
                                      }}
                                    >
                                      <div
                                        onMouseDown={e => handleIntPillDown(e, cat.key, localIdx)}
                                        onTouchStart={e => handleIntPillDown(e.touches[0], cat.key, localIdx)}
                                        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${isOwnProfile ? "cursor-grab active:cursor-grabbing" : ""}`}
                                        style={{
                                          background: pill.color + "12", border: `1px solid ${pill.color}28`,
                                          boxShadow: isDragging ? `0 0 14px ${pill.color}44` : "none",
                                          transition: "box-shadow 0.15s ease",
                                        }}
                                      >
                                        <span className="shrink-0 flex items-center justify-center rounded-lg"
                                          style={{ width: "26px", height: "26px", background: pill.color + "20", border: `1px solid ${pill.color}38`, fontSize: "13px" }}>
                                          {getPillEmoji(pill.text)}
                                        </span>
                                        <span className="flex-1 text-xs font-medium truncate" style={{ color: pill.color }}>
                                          {pill.text}
                                        </span>
                                        {isTop && (
                                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: pill.color + "22", border: `1px solid ${pill.color}40`, color: pill.color, letterSpacing: "0.02em" }}>
                                            ★
                                          </span>
                                        )}
                                        {isOwnProfile && (
                                          <svg width="7" height="11" viewBox="0 0 7 11" fill="none" style={{ opacity: 0.22, flexShrink: 0, color: textPrimary }}>
                                            <circle cx="1.5" cy="1.5" r="1.1" fill="currentColor"/>
                                            <circle cx="5.5" cy="1.5" r="1.1" fill="currentColor"/>
                                            <circle cx="1.5" cy="5.5" r="1.1" fill="currentColor"/>
                                            <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor"/>
                                            <circle cx="1.5" cy="9.5" r="1.1" fill="currentColor"/>
                                            <circle cx="5.5" cy="9.5" r="1.1" fill="currentColor"/>
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {isVibes && cat.pills.length > 0 && (
                                <p className="text-[10px] font-medium mt-0.5" style={{ color: textDim }}>
                                  ★ Top {Math.min(3, cat.pills.length)} shown as top interests
                                </p>
                              )}
                              {catIdx < grouped.length - 1 && (
                                <div className="mt-0.5" style={{ height: "1px", background: dividerCol }} />
                              )}
                            </div>
                          );
                        })}
                        {ungrouped.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {grouped.length > 0 && <div style={{ height: "1px", background: dividerCol }} />}
                            {ungrouped.map((pill, i) => (
                              <div key={pill.id ?? i} className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                                style={{ background: pill.color + "12", border: `1px solid ${pill.color}28` }}>
                                <span className="shrink-0 flex items-center justify-center rounded-lg"
                                  style={{ width: "26px", height: "26px", background: pill.color + "20", border: `1px solid ${pill.color}38`, fontSize: "13px" }}>
                                  {getPillEmoji(pill.text)}
                                </span>
                                <span className="flex-1 text-xs font-medium truncate" style={{ color: pill.color }}>{pill.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Posts & Feed card — h-[500px] matching other cards */}
            <div
              className="h-[500px] rounded-2xl p-6 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.posts.bg,
                border: `1px solid ${cardColors.posts.border}`,
                boxShadow: `0 0 40px ${cardColors.posts.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {/* header */}
              {(() => {
                const postsDark = needsDarkText(cardColors.posts.bg, cardTextOverrides.posts);
                const postsText      = postsDark ? "#111"              : "#fff";
                const postsTextDim   = postsDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)";
                const postsTextDimmer= postsDark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.22)";
                const postsDivider   = postsDark ? "rgba(0,0,0,0.1)"  : "rgba(255,255,255,0.07)";
                const postsCardBg    = postsDark ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)";
                const postsCardBorder= postsDark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";

                return (
                  <>
                    <div className="flex items-center justify-between shrink-0">
                      <h2 className="text-2xl" style={{ color: postsText, transition: "color 0.4s ease" }}>
                        Posts &amp; Feed
                      </h2>
                      <Link
                        to="/feed"
                        className="text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ color: postsTextDim }}
                      >
                        View all →
                      </Link>
                    </div>

                    {/* post stubs */}
                    <div className="flex flex-row gap-2 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                      {profilePostsLoading ? (
                        <div className="flex flex-1 items-center justify-center">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: "rgba(220,46,115,0.4)", borderTopColor: "transparent" }}
                          />
                        </div>
                      ) : profilePosts.length === 0 ? (
                        <div
                          className="flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm"
                          style={{
                            borderColor: postsDark ? "rgba(0,0,0,0.2)" : "#404040",
                            background:  postsDark ? "rgba(0,0,0,0.05)" : "rgba(23,23,23,0.5)",
                            color:       postsTextDimmer,
                          }}
                        >
                          No posts yet
                        </div>
                      ) : (
                        profilePosts.map((post) => (
                          <div
                            key={post.id}
                            className="rounded-xl overflow-hidden flex flex-col flex-1 cursor-pointer transition-all duration-150 hover:brightness-110"
                            style={{ minWidth: "130px", maxWidth: "180px" }}
                            style={{
                              background: postsCardBg,
                              border: `1px solid ${postsCardBorder}`,
                            }}
                            onClick={() => setSelectedPost(post)}
                          >
                            {/* top — avatar + name */}
                            <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
                              {post.author.avatarUrl ? (
                                <img
                                  src={post.author.avatarUrl}
                                  alt={post.author.displayName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                  style={{
                                    background: "linear-gradient(135deg,rgba(220,46,115,0.35),rgba(251,64,64,0.2))",
                                    color: "#DC2E73",
                                  }}
                                >
                                  {post.author.displayName?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-[10px] font-semibold truncate" style={{ color: postsText }}>
                                {post.author.displayName}
                              </span>
                            </div>

                            {/* text content — always right below header */}
                            {post.content && (
                              <p
                                className="text-[11px] leading-relaxed px-3"
                                style={{
                                  color: postsTextDim,
                                  display: "-webkit-box",
                                  WebkitLineClamp: post.media?.images?.[0] ? 2 : 4,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {post.content}
                              </p>
                            )}

                            {/* image — contained with gap */}
                            {post.media?.images?.[0] && (
                              <div className="px-3 mt-2">
                                <img
                                  src={post.media.images[0]}
                                  alt=""
                                  className="w-full rounded-lg object-cover"
                                  style={{ height: "90px" }}
                                />
                              </div>
                            )}

                            {/* bottom — likes + comments + time */}
                            <div className="flex items-center justify-between px-3 py-2 mt-auto">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: postsTextDimmer }}>♥ {post.likes}</span>
                                <span className="text-[10px]" style={{ color: postsTextDimmer }}>💬 {post.comments}</span>
                              </div>
                              <span className="text-[10px]" style={{ color: postsTextDimmer }}>{timeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

          </div>{/* end RIGHT COLUMN */}

            </div>{/* end two-column content grid */}
          </div>{/* end LEFT+CENTER CONTENT AREA */}

          {/* ── JAMS SIDEBAR — same structure as old InterestsSidebar: breaks through banner, minHeight: 1295px ── */}
          {(() => {
            const dark          = needsDarkText(cardColors.jams.bg, cardTextOverrides.jams);
            const textPrimary   = dark ? "#111"             : "#fff";
            const textSecondary = dark ? "#444"             : "#d4d4d4";
            const textDim       = dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";
            const dividerColor  = dark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.18)";
            const tileBg        = dark ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)";
            const tileBorder    = dark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";

            const locationStr = [city, country].filter(Boolean).join(", ");
            const joinedRaw   = user?.date_joined ?? user?.created_at ?? user?.joined_at ?? null;
            const memberSince = joinedRaw
              ? new Date(joinedRaw).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : null;
            const totalJams    = jams.length;
            const liveJams     = jams.filter(j => j.isLive).length;
            const upcomingJams = jams.filter(j => !j.isLive).length;

            const SectionDivider = () => (
              <div style={{ height: "1px", background: dividerColor, margin: "0 20px" }} />
            );
            const SectionHeading = ({ children }) => (
              <h2 className="text-2xl" style={{ color: textPrimary, transition: "color 0.4s ease" }}>{children}</h2>
            );
            const Tile = ({ left, right, accent }) => (
              <div className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ background: accent ? "rgba(220,46,115,0.08)" : tileBg, border: `1px solid ${accent ? "rgba(220,46,115,0.15)" : tileBorder}` }}>
                <span className="text-sm" style={{ color: textSecondary }}>{left}</span>
                <span className="text-sm font-bold" style={{ color: accent ? "#DC2E73" : textPrimary }}>{right}</span>
              </div>
            );

            return (
              <div className="w-[210px] shrink-0 flex flex-col self-stretch">
                <div className="rounded-2xl overflow-hidden backdrop-blur-md flex flex-col h-full"
                  style={{
                    background: cardColors.jams.bg,
                    border: `1px solid ${cardColors.jams.border}`,
                    boxShadow: `0 0 40px ${cardColors.jams.glow}`,
                    transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                  }}
                >

                  {/* ── JAMS LIST ── */}
                  <div className="p-5 flex flex-col gap-3">
                    <SectionHeading>Jams</SectionHeading>

                    {/* Live now chip */}
                    {liveJams > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium"
                          style={{ background: "rgba(220,46,115,0.18)", border: "1px solid rgba(220,46,115,0.35)", color: "#DC2E73" }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#DC2E73" }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#DC2E73" }} />
                          </span>
                          {liveJams} Live Now
                        </span>
                      </div>
                    )}

                    {jamsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
                      </div>
                    ) : jams.length === 0 ? (
                      <p className="text-sm" style={{ color: textSecondary }}>No jams yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: "380px", scrollbarWidth: "none" }}>
                        {jams.map((jam) => {
                          const isDragging   = jamDragging === jam.id;
                          const offsetX      = isDragging ? jamDragX : 0;
                          const dragProgress = Math.min(Math.abs(offsetX) / DRAG_DELETE_THRESHOLD, 1);
                          const isPast       = jam.timeSlot === "past";
                          const bgLum        = bgLuminance(jamCardColor.bg);
                          const blendD       = Math.max(0, (bgLum - 80) / 175);
                          const noteColor    = isPast ? "rgba(255,255,255,0.18)" : jam.isLive ? "#DC2E73" : "#ca8a04";
                          const titleColor   = jam.isLive
                            ? (isPast ? `rgba(180,180,180,0.4)` : `color-mix(in srgb, #DC2E73 ${Math.round(100 - blendD * 45)}%, #000)`)
                            : (isPast ? `rgba(160,160,160,0.35)` : `color-mix(in srgb, #ca8a04 ${Math.round(100 - blendD * 45)}%, #000)`);
                          const subtitleColor = `rgba(${bgLum > 140 ? "0,0,0" : "255,255,255"},${isPast ? 0.22 : (0.35 + blendD * 0.3)})`;
                          const dateColor    = jam.isLive
                            ? (isPast ? `rgba(160,160,160,0.35)` : `color-mix(in srgb, #DC2E73 ${Math.round(90 - blendD * 40)}%, #000)`)
                            : (isPast ? `rgba(140,140,140,0.28)` : bgLum > 140 ? `color-mix(in srgb, #ca8a04 ${Math.round(90 - blendD * 40)}%, #000)` : `color-mix(in srgb, #ca8a04 85%, rgba(255,255,255,0.0))`);
                          const lockColor    = `rgba(${bgLum > 140 ? "0,0,0" : "255,255,255"},${isPast ? 0.18 : (0.4 - blendD * 0.2)})`;
                          const divColor     = `rgba(${bgLum > 140 ? "0,0,0" : "255,255,255"},${isPast ? 0.06 : 0.12})`;
                          const cardBg       = jamCardColor.label === "Dark"
                            ? (isPast ? "linear-gradient(135deg,#181818 60%,#1f1f1f 100%)" : "linear-gradient(135deg,#1e1e1e 60%,#2a2a2a 100%)")
                            : jamCardColor.bg;
                          const cardBorder   = isPast
                            ? `1px solid rgba(${bgLum > 140 ? "0,0,0" : "255,255,255"},0.06)`
                            : jam.isLive
                              ? `1px solid color-mix(in srgb, rgba(220,46,115,0.35) 100%, ${jamCardColor.border})`
                              : `1px solid color-mix(in srgb, rgba(202,138,4,0.25) 100%, ${jamCardColor.border})`;

                          return (
                            <div key={jam.id} className="relative">
                              {isDragging && dragProgress > 0.45 && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-3 z-10">
                                  <span className="text-[10px] font-medium text-red-300">Delete</span>
                                </div>
                              )}
                              {isDragging && (
                                <div className="pointer-events-none absolute inset-0 rounded-xl bg-red-500/10 z-0" />
                              )}
                              <div
                                onMouseDown={(e) => handleJamDragStart(jam.id, e)}
                                onTouchStart={(e) => handleJamDragStart(jam.id, e)}
                                onClick={() => { if (!jamMovedRef.current) setSelectedJam(jam); jamMovedRef.current = false; }}
                                className="relative z-10 flex items-center gap-2 cursor-pointer select-none"
                                style={{
                                  background: cardBg, borderRadius: "14px", border: cardBorder,
                                  padding: "10px 12px",
                                  boxShadow: isPast ? "0 2px 8px -2px rgba(0,0,0,0.3)"
                                    : jam.isLive ? "0 0 0 1px rgba(220,46,115,0.1), 0 6px 16px -4px rgba(220,46,115,0.15)"
                                    : "0 0 0 1px rgba(202,138,4,0.08), 0 6px 16px -4px rgba(202,138,4,0.12)",
                                  transform: `translateX(${offsetX}px) rotate(${offsetX * 0.02}deg)`,
                                  opacity: isDragging ? 1 - Math.abs(offsetX) / 320 : isPast ? 0.6 : 1,
                                  transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
                                }}
                              >
                                <div style={{ width: "1px", height: "32px", background: divColor, marginRight: "8px", flexShrink: 0 }} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate" style={{ fontSize: "12px", margin: 0, color: titleColor }}>{jam.title}</p>
                                  <p className="truncate" style={{ fontSize: "10px", margin: "2px 0 0", color: subtitleColor }}>
                                    {[jam.genre, jam.vibe].filter(Boolean).join(" · ")}
                                  </p>
                                  <p className="font-semibold" style={{ fontSize: "10px", margin: "2px 0 0", color: dateColor }}>
                                    {isPast ? "Past" : jam.isLive ? "Live Now" : jam.timeSlot === "tonight" ? "Tonight" : jam.timeSlot === "tomorrow" ? "Tomorrow" : jam.timeSlot === "week" ? "This Week" : "Upcoming"}
                                    {jam.dateTime ? ` · ${jam.dateTime}` : ""}
                                  </p>
                                </div>
                                {jam.isPrivate && (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0">
                                    <rect x="3" y="11" width="18" height="11" rx="2" stroke={lockColor} strokeWidth="1.8"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={lockColor} strokeWidth="1.8" strokeLinecap="round"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <SectionDivider />

                  {/* ── PROFILE ── */}
                  <div className="p-5 flex flex-col gap-3">
                    <SectionHeading>Profile</SectionHeading>
                    <div className="flex flex-col gap-2">
                      {locationStr && (
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
                          <span style={{ fontSize: "13px" }}>📍</span>
                          <span className="text-sm truncate" style={{ color: textSecondary }}>{locationStr}</span>
                        </div>
                      )}
                      {memberSince && (
                        <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "13px" }}>🗓️</span>
                            <span className="text-sm" style={{ color: textSecondary }}>Joined</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: textPrimary }}>{memberSince}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "13px" }}>🎸</span>
                          <span className="text-sm" style={{ color: textSecondary }}>Jams</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: textPrimary }}>{totalJams}</span>
                      </div>
                    </div>
                  </div>

                  <SectionDivider />

                  {/* ── STATS ── */}
                  <div className="p-5 flex flex-col gap-3">
                    <SectionHeading>Stats</SectionHeading>
                    <div className="flex flex-col gap-2">
                      <Tile left={<><span style={{marginRight:6}}>🎸</span>Total Jams</>}  right={totalJams}    accent={true} />
                      <Tile left={<><span style={{marginRight:6}}>🔴</span>Live now</>}    right={liveJams}     accent={false} />
                      <Tile left={<><span style={{marginRight:6}}>📅</span>Upcoming</>}    right={upcomingJams} accent={false} />
                    </div>
                  </div>

                  {/* ── ADD FRIEND — only visible on other people's profiles ── */}
                  {!isOwnProfile && (
                    <div className="p-5 mt-auto">
                      <button
                        onClick={handleAddFriend}
                        disabled={friendLoading || friendStatus !== "none"}
                        className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 group relative overflow-hidden"
                        style={{
                          background: friendStatus === "friends"
                            ? "rgba(22,163,74,0.15)"
                            : friendStatus === "pending"
                            ? "rgba(202,138,4,0.12)"
                            : "rgba(220,46,115,0.12)",
                          border: friendStatus === "friends"
                            ? "1px solid rgba(22,163,74,0.35)"
                            : friendStatus === "pending"
                            ? "1px solid rgba(202,138,4,0.30)"
                            : "1px solid rgba(220,46,115,0.30)",
                          color: friendStatus === "friends"
                            ? "#16a34a"
                            : friendStatus === "pending"
                            ? "#ca8a04"
                            : "#DC2E73",
                          boxShadow: friendStatus === "none" ? "0 0 20px rgba(220,46,115,0.15)" : "none",
                          opacity: friendLoading ? 0.6 : 1,
                          cursor: friendStatus !== "none" ? "default" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (friendStatus !== "none") return;
                          e.currentTarget.style.background = "rgba(220,46,115,0.22)";
                          e.currentTarget.style.boxShadow = "0 0 28px rgba(220,46,115,0.35)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          if (friendStatus !== "none") return;
                          e.currentTarget.style.background = "rgba(220,46,115,0.12)";
                          e.currentTarget.style.boxShadow = "0 0 20px rgba(220,46,115,0.15)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {friendLoading ? "…" : friendStatus === "friends" ? "✓ Friends" : friendStatus === "pending" ? "Request Sent" : "+ Add Friend"}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

        </div>{/* end top-level flex row */}
      </main>

      {createPortal(
        <>
          {/* ── Jam Stub Modal ────────────────────────────────────────────────────
           *
           * Lifted out of the jams panel and promoted to a fixed full-screen modal
           * so it can blur the entire page behind it and close reliably on backdrop click.
           *
           * selectedJam drives open/closed — null = closed, jam object = open.
           * The accent color and status are derived fresh from the jam's date
           * via the shared isUpcoming() from jamUtils.js.
           *
           * Animation: stubSlideIn keyframe defined in index.css slides the card
           * in from the left. It fires automatically on mount because React creates
           * a new DOM element each time selectedJam changes from null → a jam.
           * ──────────────────────────────────────────────────────────────────────── */}
      {selectedJam && (() => {
        const live       = selectedJam.isLive;
        const accent     = live ? "#DC2E73" : "#ca8a04";
        const accentDim  = live ? "rgba(220,46,115,0.18)" : "rgba(202,138,4,0.14)";
        const accentBorder = live ? "rgba(220,46,115,0.30)" : "rgba(202,138,4,0.25)";

        const statusLabel = live ? "Live Now"
          : selectedJam.timeSlot === "tonight"  ? "Tonight"
          : selectedJam.timeSlot === "tomorrow" ? "Tomorrow"
          : selectedJam.timeSlot === "week"     ? "This Week"
          : "Upcoming";

        // Tag rows — genre gets 🎵, vibe gets 🌊 as fallback emojis
        const tags = [
          selectedJam.genre && { label: selectedJam.genre, emoji: getPillEmoji(selectedJam.genre), color: live ? "#DC2E73" : "#ca8a04" },
          selectedJam.vibe  && { label: selectedJam.vibe,  emoji: getPillEmoji(selectedJam.vibe),  color: "#7c3aed" },
        ].filter(Boolean);

        // Extra optional fields the API may return
        const host        = selectedJam.host        ?? selectedJam.creator?.display_name ?? selectedJam.creator?.username ?? null;
        const location    = selectedJam.location    ?? selectedJam.venue ?? null;
        const attendees   = selectedJam.attendees   ?? selectedJam.attendee_count ?? null;
        const maxAttendees= selectedJam.maxAttendees ?? selectedJam.max_attendees ?? null;
        const instruments = Array.isArray(selectedJam.instruments)
          ? selectedJam.instruments.map(i => typeof i === "string" ? i : i?.name).filter(Boolean)
          : null;

        return (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <div onClick={() => setSelectedJam(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            <div
              className="relative z-10 w-[560px] max-w-[96vw] rounded-3xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#0f0f0f",
                border: `1px solid ${accentBorder}`,
                boxShadow: `0 0 0 1px ${accentBorder}, 0 0 80px ${accentDim}, 0 32px 80px rgba(0,0,0,0.9)`,
                animation: "stubSlideIn 0.28s cubic-bezier(0.4,0,0.2,1) forwards",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header band ── */}
              <div
                className="relative px-7 pt-7 pb-6 flex flex-col gap-3"
                style={{
                  background: `linear-gradient(160deg, ${accentDim} 0%, rgba(0,0,0,0) 60%)`,
                  borderBottom: `1px solid ${accentBorder}`,
                }}
              >
                {/* Status pill + close */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {live && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: accent }} />
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full tracking-wide"
                      style={{ background: accentDim, border: `1px solid ${accentBorder}`, color: accent }}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-xs text-white/30">
                      {selectedJam.isPrivate ? "🔒 Private" : "🔓 Public"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedJam(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold leading-tight" style={{ color: accent }}>
                  {selectedJam.title}
                </h2>

                {/* Genre + vibe tags inline */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          background: tag.color + "18",
                          border: `1px solid ${tag.color}40`,
                          color: tag.color,
                        }}
                      >
                        <span>{tag.emoji}</span>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Body ── */}
              <div className="px-7 py-5 flex flex-col gap-5">

                {/* Description */}
                {selectedJam.description && (
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {selectedJam.description}
                  </p>
                )}

                {/* Info grid — always show date/time, show extras if present */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Date / Time */}
                  <div
                    className="flex flex-col gap-1 rounded-2xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>When</span>
                    <span className="text-sm font-medium text-white">{selectedJam.dateTime ?? statusLabel}</span>
                  </div>

                  {/* Access */}
                  <div
                    className="flex flex-col gap-1 rounded-2xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Access</span>
                    <span className="text-sm font-medium text-white">{selectedJam.isPrivate ? "Private" : "Public"}</span>
                  </div>

                  {/* Host — if available */}
                  {host && (
                    <div
                      className="flex flex-col gap-1 rounded-2xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Host</span>
                      <span className="text-sm font-medium text-white truncate">{host}</span>
                    </div>
                  )}

                  {/* Location — if available */}
                  {location && (
                    <div
                      className="flex flex-col gap-1 rounded-2xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Location</span>
                      <span className="text-sm font-medium text-white truncate">{location}</span>
                    </div>
                  )}

                  {/* Attendees — if available */}
                  {attendees !== null && (
                    <div
                      className="flex flex-col gap-1 rounded-2xl px-4 py-3"
                      style={{ background: accentDim, border: `1px solid ${accentBorder}` }}
                    >
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: accent + "99" }}>Attending</span>
                      <span className="text-sm font-bold" style={{ color: accent }}>
                        {attendees}{maxAttendees ? ` / ${maxAttendees}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Instruments row — if available */}
                {instruments && instruments.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>Instruments</span>
                    <div className="flex flex-wrap gap-2">
                      {instruments.map((inst, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(8,145,178,0.12)",
                            border: "1px solid rgba(8,145,178,0.30)",
                            color: "#38bdf8",
                          }}
                        >
                          <span>{getPillEmoji(inst)}</span>
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* ── Footer ── */}
              <div
                className="px-7 py-4 flex items-center justify-between"
                style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}
              >
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                  #{selectedJam.id?.toString().slice(-6) ?? "—"}
                </span>
                <div className="text-base">
                  {live ? "🎸🔥🎶" : "🎵✨🎹"}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Post Stub Modal ────────────────────────────────────────────────────── */}
      {selectedPost && (() => {
        const post = selectedPost;
        return (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <div onClick={() => setSelectedPost(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div
              className="relative z-10 w-[480px] max-w-[96vw] rounded-3xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#0f0f0f",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.9)",
                animation: "stubSlideIn 0.28s cubic-bezier(0.4,0,0.2,1) forwards",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* header */}
              <div
                className="px-6 pt-6 pb-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,rgba(220,46,115,0.35),rgba(251,64,64,0.2))", color: "#DC2E73" }}
                    >
                      {post.author.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{post.author.displayName}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {post.author.username} · {timeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* image */}
              {post.media?.images?.[0] && (
                <img src={post.media.images[0]} alt="" className="w-full max-h-72 object-cover" />
              )}

              {/* content */}
              {post.content && (
                <div className="px-6 py-5">
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {post.content}
                  </p>
                </div>
              )}

              {/* footer */}
              <div
                className="px-6 py-4 flex items-center gap-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>♥ {post.likes}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>💬 {post.comments}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Pill Viewer Modal ─────────────────────────────────────────────────
       * Read-only view of selected pills — accessible to anyone viewing the profile.
       * Opens when user clicks the scrolling pill strip on the About Me card.
       * ──────────────────────────────────────────────────────────────────── */}
      {pillViewerOpen && pills.length > 0 && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div
            onClick={() => setPillViewerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <div
            className="relative z-10 w-[480px] max-w-[94vw] rounded-3xl bg-neutral-900 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Their Sound</h3>
              <p className="text-xs text-neutral-600">{pills.length} tags</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {pills.map((pill, i) => (
                <span
                  key={i}
                  className="rounded-full px-4 py-1.5 text-sm font-medium"
                  style={{
                    backgroundColor: pill.color + "22",
                    border: `1px solid ${pill.color}88`,
                    color: pill.color,
                    boxShadow: `0 0 12px ${pill.color}33`,
                  }}
                >
                  {pill.text}
                </span>
              ))}
            </div>

            <button
              onClick={() => setPillViewerOpen(false)}
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Pill Picker Modal ─────────────────────────────────────────────────
       * Opens centered over the edit modal when user taps the pills strip.
       * Shows all available genres, instruments, and vibes as toggleable pills.
       * Selected ones glow, unselected ones are dim. Max 9 can be selected.
       * ──────────────────────────────────────────────────────────────────── */}
      {pillPickerOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div
            onClick={() => setPillPickerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="relative z-10 w-[560px] max-w-[94vw] rounded-3xl bg-neutral-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid rgba(255,255,255,0.08)", maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 className="text-base font-semibold text-white">Your Sound</h3>
                <p className="text-xs text-neutral-600 mt-0.5">Pick up to {MAX_PILLS} tags that describe your music</p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: selectedTagIds.size >= MAX_PILLS ? "#DC2E73" : "rgba(255,255,255,0.4)" }}
              >
                {selectedTagIds.size}/{MAX_PILLS}
              </span>
            </div>

            {/* Tag grid — scrollable */}
            {tagsLoading ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4 flex flex-col gap-5">
                {/* Genres */}
                {allTags.filter(t => t.uid.startsWith("g_")).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.filter(t => t.uid.startsWith("g_")).map((tag) => {
                        const selected = selectedTagIds.has(tag.uid);
                        const atMax = selectedTagIds.size >= MAX_PILLS && !selected;
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={atMax} color={color} onToggle={() => toggleTag(tag)} />;
                      })}
                    </div>
                  </div>
                )}

                {/* Instruments */}
                {allTags.filter(t => t.uid.startsWith("i_")).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600">Instruments</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.filter(t => t.uid.startsWith("i_")).map((tag) => {
                        const selected = selectedTagIds.has(tag.uid);
                        const atMax = selectedTagIds.size >= MAX_PILLS && !selected;
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={atMax} color={color} onToggle={() => toggleTag(tag)} />;
                      })}
                    </div>
                  </div>
                )}

                {/* Vibes */}
                {allTags.filter(t => t.uid.startsWith("v_")).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600">Vibes</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.filter(t => t.uid.startsWith("v_")).map((tag) => {
                        const selected = selectedTagIds.has(tag.uid);
                        const atMax = selectedTagIds.size >= MAX_PILLS && !selected;
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={atMax} color={color} onToggle={() => toggleTag(tag)} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 pb-5 pt-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setPillPickerOpen(false)}
                className="w-full rounded-xl bg-[#DC2E73] py-2.5 text-sm font-semibold text-white hover:bg-pink-500 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal — only rendered for own profile */}
      {isOwnProfile && editOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            onClick={() => setEditOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div
            className="relative z-[1000] flex w-[900px] max-w-[94vw] max-h-[90vh] flex-col gap-6 rounded-3xl bg-neutral-900 p-6 text-white shadow-xl md:flex-row overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-[250px]">
              <h2 className="mb-4 text-2xl font-semibold">Profile Edits</h2>

              <div className="space-y-3">
                {sectionButtons.map((item) => {
                  const isActive = activeSection === item;

                  return (
                    <button
                      key={item}
                      onClick={() => setActiveSection(item)}
                      className="relative w-full overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <div
                        className={`absolute inset-0 bg-[#DC2E73] transition-all duration-300 ${
                          isActive ? "w-full" : "w-0 group-hover:w-full"
                        }`}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive ? "text-black" : "text-white"
                        }`}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[320px] flex-1 rounded-2xl border border-white/10 bg-white/5 p-5">
              {activeSection === "Name & Location" && (
                <div className="flex flex-col gap-5">
                  {/* Display name */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest">Display name</p>
                    <input
                      value={name}
                      onChange={(e) => { if (e.target.value.length <= 15) setName(e.target.value); }}
                      className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none border border-transparent focus:border-[#DC2E73]/40 transition-colors"
                      placeholder="Your name"
                      maxLength={15}
                    />
                    <p className="text-xs text-neutral-600 text-right">{name.length}/15</p>
                  </div>

                  {/* City + Country side by side */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest">Location</p>
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          value={city}
                          onChange={(e) => {
                            if (e.target.value.length > 15) return;
                            setCity(e.target.value);
                            const parts = [e.target.value, country].filter(Boolean);
                            setLocation(parts.join(", "));
                          }}
                          className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none border border-transparent focus:border-[#DC2E73]/40 transition-colors"
                          placeholder="City"
                          maxLength={15}
                        />
                        <p className="text-xs text-neutral-600 text-right">{city.length}/15</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          value={country}
                          onChange={(e) => {
                            if (e.target.value.length > 15) return;
                            setCountry(e.target.value);
                            const parts = [city, e.target.value].filter(Boolean);
                            setLocation(parts.join(", "));
                          }}
                          className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none border border-transparent focus:border-[#DC2E73]/40 transition-colors"
                          placeholder="Country"
                          maxLength={15}
                        />
                        <p className="text-xs text-neutral-600 text-right">{country.length}/15</p>
                      </div>
                    </div>
                    {location && (
                      <p className="text-xs text-neutral-600">Shows as: {location}</p>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "Profile Picture" && (
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="profileUpload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      openCrop("profile", file);
                      e.target.value = "";
                    }}
                  />

                  <label
                    htmlFor="profileUpload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-black"
                  >
                    <i className="fa-solid fa-upload text-sm"></i>
                    <span className="text-sm font-medium">Upload Image</span>
                  </label>

                  <p className="text-center text-xs text-neutral-500">
                    PNG, JPG recommended
                  </p>
                </div>
              )}

              {activeSection === "Banner" && (
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="bannerUpload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      openCrop("banner", file);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="bannerUpload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
                  >
                    <i className="fa-solid fa-upload text-sm" />
                    <span className="text-sm font-medium">Upload Banner</span>
                  </label>
                  <p className="text-center text-xs text-neutral-500">Wide image recommended (16:5 ratio)</p>
                  {banner && (
                    <div
                      className="h-16 w-full rounded-xl border border-white/10 bg-cover bg-center"
                      style={{ backgroundImage: `url(${banner})` }}
                    />
                  )}
                  {/* Manual light/dark text override */}
                  <div className="flex items-center justify-between rounded-xl bg-neutral-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Light text on banner</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {bannerDark ? "Auto-detected: dark banner" : "Auto-detected: light banner"}
                      </p>
                    </div>
                    <button
                      onClick={() => setBannerDark((v) => !v)}
                      className="relative w-10 h-6 rounded-full transition-colors duration-200"
                      style={{ background: bannerDark ? "#DC2E73" : "#404040" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: bannerDark ? "calc(100% - 22px)" : "2px" }}
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "About Me" && (
                <div className="flex flex-col gap-4">
                  {/* Headline input */}
                  <div>
                    <p className="mb-1.5 text-sm text-neutral-400">Headline</p>
                    <input
                      type="text"
                      value={headline}
                      maxLength={20}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Add your headline!"
                      className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none border border-transparent focus:border-[#DC2E73]/40 transition-colors"
                    />
                    <p className="mt-1 text-xs text-neutral-400">{headline.length}/20 characters</p>
                  </div>

                  {/* Bio textarea */}
                  <div>
                    <p className="mb-1.5 text-sm text-neutral-400">Bio</p>
                    <textarea
                      value={about}
                      maxLength={200}
                      onChange={(e) => setAbout(e.target.value)}
                      className="min-h-[120px] w-full resize-none rounded-lg bg-neutral-800 p-3 text-sm"
                    />
                    <p className="mt-1 text-xs text-neutral-400">{about.length}/200 characters</p>
                  </div>

                  {/* Photo upload — side by side with preview when set */}
                  <div>
                    <p className="mb-1.5 text-sm text-neutral-400">Photo <span className="text-neutral-600">(optional, appears tilted)</span></p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="aboutPhotoUpload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            openCrop("square", file);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor="aboutPhotoUpload"
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
                        >
                          <i className="fa-solid fa-upload text-sm" />
                          <span className="text-sm font-medium">{aboutPhoto ? "Change Photo" : "Upload Photo"}</span>
                        </label>
                        {aboutPhoto && (
                          <button
                            onClick={() => { URL.revokeObjectURL(aboutPhoto); setAboutPhoto(null); }}
                            className="text-xs text-neutral-500 hover:text-red-400 transition text-center"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>

                      {/* Tilted preview */}
                      {aboutPhoto && (
                        <div
                          className="shrink-0 w-[72px] h-[90px] rounded-lg overflow-hidden border-4 border-white/80 shadow-lg"
                          style={{
                            transform: "rotate(6deg)",
                            backgroundImage: `url(${aboutPhoto})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "Pills" && (
                <div className="flex flex-col gap-4" style={{ height: "280px" }}>
                  <p className="text-xs text-neutral-500">
                    {pills.length}/{MAX_PILLS} selected — click the strip to edit
                  </p>

                  {/* Scrollable strip of selected pills — click to open picker */}
                  <button
                    onClick={async () => {
                      setPillPickerOpen(true);
                      if (allTags.length === 0) {
                        setTagsLoading(true);
                        try {
                          const { genres, instruments, vibes } = await apiService.getAllFormOptions();
                          const fetched = [
                            ...(genres ?? []).map(t => ({ ...t, uid: `g_${t.id}` })),
                            ...(instruments ?? []).map(t => ({ ...t, uid: `i_${t.id}` })),
                            ...(vibes ?? []).map(t => ({ ...t, uid: `v_${t.id}` })),
                          ];
                          setAllTags(fetched);
                          const currentIds = new Set(pills.map((p) => p.id).filter(Boolean));
                          setSelectedTagIds(currentIds);
                        } catch (e) {
                          console.error("Failed to fetch tags:", e);
                        } finally {
                          setTagsLoading(false);
                        }
                      } else {
                        const currentIds = new Set(pills.map((p) => p.id).filter(Boolean));
                        setSelectedTagIds(currentIds);
                      }
                    }}
                    className="w-full hide-scrollbar rounded-2xl bg-neutral-800/60 border border-white/10 px-4 py-3 flex items-center gap-2 cursor-pointer hover:border-white/20 transition-colors"
                    style={{ height: "52px", overflow: "hidden" }}
                  >
                    {pills.length === 0 ? (
                      <span className="text-xs text-neutral-600 shrink-0">Tap to pick your sound...</span>
                    ) : (
                      <>
                        {pills.slice(0, 4).map((pill, i) => (
                          <span
                            key={i}
                            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                            style={{
                              backgroundColor: pill.color + "22",
                              border: `1px solid ${pill.color}88`,
                              color: pill.color,
                              boxShadow: `0 0 8px ${pill.color}33`,
                            }}
                          >
                            {pill.text}
                          </span>
                        ))}
                        {pills.length > 4 && (
                          <span
                            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            +{pills.length - 4} more
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeSection === "Card Colors" && (
                <div className="flex flex-col gap-1">

                  {/* Five compact rows */}
                  <CardColorRow
                    label="About Me"
                    value={cardColors.aboutMe}
                    onChange={(c) => setCardColor("aboutMe", c)}
                  />
                  <div className="h-px bg-white/[0.06]" />
                  <CardColorRow
                    label="Music Snips"
                    value={cardColors.musicSnips}
                    onChange={(c) => setCardColor("musicSnips", c)}
                  />
                  <div className="h-px bg-white/[0.06]" />
                  <CardColorRow
                    label="Jams"
                    value={cardColors.jams}
                    onChange={(c) => setCardColor("jams", c)}
                  />
                  <div className="h-px bg-white/[0.06]" />
                  <CardColorRow
                    label="Jam Cards"
                    value={jamCardColor}
                    onChange={(c) => setJamCardColor(c)}
                  />
                  <div className="h-px bg-white/[0.06]" />
                  <CardColorRow
                    label="Posts"
                    value={cardColors.posts}
                    onChange={(c) => setCardColor("posts", c)}
                  />
                  <div className="h-px bg-white/[0.06]" />
                  <CardColorRow
                    label="Interests"
                    value={cardColors.interests}
                    onChange={(c) => setCardColor("interests", c)}
                  />

                  {/* Global text color toggle */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">Text color</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {globalTextOverride === null ? "Auto per card" : globalTextOverride ? "Dark (all cards)" : "Light (all cards)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Auto button */}
                      <button
                        onClick={() => setGlobalText(null)}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-md transition-all duration-150"
                        style={{
                          background: globalTextOverride === null ? "rgba(255,255,255,0.15)" : "transparent",
                          color: globalTextOverride === null ? "#fff" : "#666",
                          border: "1px solid",
                          borderColor: globalTextOverride === null ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        Auto
                      </button>
                      {/* Dark text button — dark square */}
                      <button
                        onClick={() => setGlobalText(true)}
                        title="Dark text on all cards"
                        className="w-8 h-8 rounded-lg transition-all duration-150 hover:scale-105 active:scale-[1.03]"
                        style={{
                          background: "#111",
                          outline: globalTextOverride === true ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                          outlineOffset: globalTextOverride === true ? "2px" : "0",
                        }}
                      />
                      {/* Light text button — light square */}
                      <button
                        onClick={() => setGlobalText(false)}
                        title="Light text on all cards"
                        className="w-8 h-8 rounded-lg transition-all duration-150 hover:scale-105 active:scale-[1.03]"
                        style={{
                          background: "#e5e5e5",
                          outline: globalTextOverride === false ? "2px solid #DC2E73" : "1px solid rgba(255,255,255,0.15)",
                          outlineOffset: globalTextOverride === false ? "2px" : "0",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/*
               * ── SAVE — BACKEND WIRING GUIDE ──────────────────────────────
               *
               * Call updateProfile() from useAuth (add to destructure at top).
               * All variables listed below are live in local state right now.
               *
               * ── ALREADY EXISTS ON YOUR MODEL ──────────────────────────────
               *   display_name        → name              (string, max 15)
               *   city                → city              (string, max 15)
               *   country             → country           (string, max 15)
               *   about               → about             (string, max 200)
               *   pfp                 → profilePic        (dataURL → File before PATCH)
               *   genres_liked        → orderedGenreIds   (int[], ordered — index 0 = favorite)
               *   instruments_liked   → orderedInstrumentIds (int[], ordered)
               *   vibes_liked         → orderedVibeIds    (int[], ordered)
               *
               * ── NEW FIELDS — ADD TO PROFILE MODEL ─────────────────────────
               *   headline            → headline          (string, max 20)
               *   available_to_jam    → availableToJam    (boolean)
               *   banner              → banner            (dataURL → ImageField)
               *   about_photo         → aboutPhoto        (dataURL → ImageField)
               *   profile_theme       → profile_theme     (JSONField) — shape:
               *     {
               *       cardColors:        { aboutMe, musicSnips, jams, posts, interests },
               *       jamCardColor:      swatch object for individual jam row cards,
               *       cardTextOverrides: { aboutMe, musicSnips, jams, posts, interests },
               *       bannerDark:        boolean (light text on banner)
               *     }
               *
               * ── FRIEND REQUEST (separate endpoint) ────────────────────────
               *   apiService.sendFriendRequest(userId)
               *   friendStatus local state: "none" | "pending" | "friends"
               *   Seed friendStatus on load from the viewed user's friend relation.
               * ─────────────────────────────────────────────────────────────── */}
              <div className="mt-6 flex gap-3">
                {/* ▼▼▼ SAVE — calls updateProfile() → PATCH api/profiles/me/ ▼▼▼ */}
                <button
                  onClick={async () => {
                    // ── Build ordered tag arrays from pill order ──────────────
                    const orderedGenreIds      = pills.filter(p => p.id?.startsWith("g_")).map(p => +p.id.slice(2));
                    const orderedInstrumentIds = pills.filter(p => p.id?.startsWith("i_")).map(p => +p.id.slice(2));
                    const orderedVibeIds       = pills.filter(p => p.id?.startsWith("v_")).map(p => +p.id.slice(2));
                    const profile_theme = {
                      cardColors,
                      jamCardColor,
                      cardTextOverrides,
                      bannerDark,
                    };

                    // ── Convert a dataURL to Blob (only when image was changed locally) ──
                    const toBlob = (dataUrl) => {
                      if (!dataUrl || !dataUrl.startsWith("data:")) return undefined;
                      const [header, b64] = dataUrl.split(",");
                      const mime = header.match(/:(.*?);/)[1];
                      const bytes = atob(b64);
                      const arr = new Uint8Array(bytes.length);
                      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                      return new Blob([arr], { type: mime });
                    };

                    try {
                      // ── PATCH payload → updateProfile() in Auth.jsx ───────
                      await updateProfile({
                        display_name:       name,
                        city,
                        country,
                        about,
                        headline,
                        available_to_jam:   availableToJam,
                        pfp:                toBlob(profilePic),
                        genres_liked:       orderedGenreIds,
                        instruments_liked:  orderedInstrumentIds,
                        vibes_liked:        orderedVibeIds,
                        profile_theme:      JSON.stringify(profile_theme),
                        // ── BACKEND NEEDED: uncomment once ImageFields exist ──
                        // banner:          toBlob(banner),
                        // about_photo:     toBlob(aboutPhoto),
                      });
                      // ─────────────────────────────────────────────────────
                      showToast("Profile saved!");
                      setEditOpen(false);
                    } catch (err) {
                      console.error("Failed to save profile:", err);
                      showToast("Failed to save. Please try again.");
                    }
                  }}
                  className="flex-1 rounded-full bg-[#DC2E73] px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-pink-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-full bg-neutral-700 px-4 py-2 text-sm text-white cursor-pointer hover:bg-neutral-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snippet Upload Modal */}
      {snippetModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center">
          <div
            onClick={() => setSnippetModalOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div
            className="relative z-[3001] w-[420px] rounded-2xl bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-semibold">Upload Snippet</h2>

            <div className="mb-5">
              <p className="mb-1.5 text-sm text-neutral-400">Title</p>
              <input
                type="text"
                placeholder="Name your snippet..."
                value={newSnippet.title}
                onChange={(e) => { if (e.target.value.length <= 20) setNewSnippet((prev) => ({ ...prev, title: e.target.value })); }}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none border border-transparent focus:border-[#DC2E73]/50"
              />
            </div>

            <div className="mb-5">
              <p className="mb-1.5 text-sm text-neutral-400">Audio File</p>
              <input
                type="file"
                accept=".mp3,.wav,audio/*"
                id="snippetAudio"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setNewSnippet((prev) => ({
                    ...prev,
                    audioFile: file,
                    audioName: file.name,
                  }));
                }}
              />
              <label
                htmlFor="snippetAudio"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
              >
                <i className="fa-solid fa-music text-sm" />
                <span className="text-sm font-medium truncate max-w-[240px]">
                  {newSnippet.audioName ? newSnippet.audioName : "Choose Audio"}
                </span>
              </label>
            </div>

            <div className="mb-6">
              <p className="mb-1.5 text-sm text-neutral-400">
                Background Image <span className="text-neutral-600">(optional)</span>
              </p>
              <input
                type="file"
                accept="image/*"
                id="snippetBg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  openCrop("snippet", file);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="snippetBg"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
                style={newSnippet.background ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${newSnippet.background})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderColor: "transparent",
                } : {}}
              >
                <i className="fa-solid fa-image text-sm" />
                <span className="text-sm font-medium">
                  {newSnippet.background ? "Change Background" : "Choose Background"}
                </span>
              </label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setSnippetModalOpen(false)}
                className="rounded-lg bg-neutral-700 px-4 py-2 text-sm hover:bg-neutral-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSnippet}
                className="rounded-lg bg-pink-600 px-4 py-2 text-sm hover:bg-pink-500 transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unified Crop Modal ── */}
      {cropState.open && (
        <CropperThings
          variant={cropState.variant}
          rawImage={cropState.rawImage}
          onClose={closeCrop}
          onSave={(dataURL) => {
            if (cropState.variant === "profile") {
              setProfilePic(dataURL);
            } else if (cropState.variant === "banner") {
              const img = new Image();
              img.onload = () => {
                const sampleW = Math.floor(img.width * 0.3);
                const c = document.createElement("canvas");
                c.width = sampleW; c.height = img.height;
                const ctx = c.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, sampleW, img.height, 0, 0, sampleW, img.height);
                  const data = ctx.getImageData(0, 0, sampleW, img.height).data;
                  const pixels = data.length / 4;
                  let total = 0;
                  for (let p = 0; p < data.length; p += 4) {
                    total += 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
                  }
                  setBannerDark(total / pixels < 128);
                }
              };
              img.src = dataURL;
              revokeObjectUrl(banner);
              setBanner(dataURL);
            } else if (cropState.variant === "square") {
              if (aboutPhoto) URL.revokeObjectURL(aboutPhoto);
              setAboutPhoto(dataURL);
            } else if (cropState.variant === "portrait") {
              if (newPost.image) URL.revokeObjectURL(newPost.image);
              setNewPost((p) => ({ ...p, image: dataURL }));
            } else if (cropState.variant === "snippet") {
              revokeObjectUrl(newSnippet.background);
              setNewSnippet((prev) => ({ ...prev, background: dataURL }));
            }
          }}
        />
      )}

      {/* Toast notification */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: toast ? "24px" : "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          transition: "top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
          pointerEvents: toast ? "auto" : "none",
        }}
      >
        {toast && (
          <div
            onClick={() => setToast(null)}
            style={{
              background: "linear-gradient(135deg, #D33280 0%, #b02268 100%)",
              boxShadow: "0 0 0 1px #D3328055, 0 8px 32px #D3328066, 0 2px 8px rgba(0,0,0,0.5)",
              borderRadius: "9999px",
              padding: "10px 22px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "220px",
              maxWidth: "420px",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
              <path d="M8 5v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="11" r="0.75" fill="white"/>
            </svg>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>
              {toast}
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", marginLeft: "auto", paddingLeft: "8px" }}>✕</span>
          </div>
        )}
      </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Profile;