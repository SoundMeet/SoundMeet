import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { jamService } from "../injectables/jamService";
import { apiService } from "../injectables/apiCalls";
import { postService } from "../injectables/postService";
import { musicSnipService } from "../injectables/musicSnipService";
import CropperThings from "../components/CropperThings";
import EventDetailModal from "../components/event-detail/EventDetailModal";
import { FeedPost } from "../components/friends/FeedPost";
import { extractEventLink, stripEventLink } from "../utils/eventLinkParser";
import { EventInviteCard } from "../components/event-invite/EventInviteCard";
import { useAuth } from "../injectables/Auth";
import { useAuthModal } from "../context/AuthModalContext";
import { formatAvatarUrl } from "../utils/formatAvatarUrl";
import { useFriends } from "../context/FriendsContext";
import { getDiscoveryAccentColor, hexToRgba, DISCOVERY_VARIANTS } from "../utils/discovery";
import { ProfileLinksCard, LinksEditSection, HeroLinks } from "../components/profile/ProfileLinksCard";
import { LINK_PLATFORMS } from "../utils/linkPlatforms";
// ─────────────────────────────────────────────────────────────────────────────

// ── Jam card sub-components (mirrors MyJams CompactEventCard style) ───────────
function JamTypeBadge({ type }) {
  const variant = DISCOVERY_VARIANTS[type] ?? DISCOVERY_VARIANTS.jam;
  const color = variant.accentColor;
  return (
    <span
      className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
      style={{ color, background: hexToRgba(color, 0.14) }}
    >
      {variant.label}
    </span>
  );
}

function JamStatusPill({ item }) {
  const isLive = item?.timeSlot === "live" || item?.isLive;
  const isCreator = item?.canEdit;
  const isAttendee = item?.isAttendee;
  if (isLive) return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ color: "#FB4040", background: "rgba(251,64,64,0.12)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#FB4040] animate-pulse inline-block" />
      Live
    </span>
  );
  if (isCreator) return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ color: "#DC2E73", background: "rgba(220,46,115,0.10)" }}
    >
      Hosting
    </span>
  );
  if (isAttendee) return (
    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-neutral-400 bg-neutral-800">
      Going
    </span>
  );
  return null;
}

const MAX_SNIPPETS = 5;

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
  trumpet: "🎺", cello: "🎻", vocals: "🎤", singing: "🎤",
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



// ─────────────────────────────────────────────────────────────────────────────

const Profile = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Name & Location");

  // ── Route param — /profile/:username ─────────────────────────────────────
  // If a username is present in the URL we're viewing someone else's profile.
  // If not, we're viewing our own. isOwnProfile gates all edit affordances.
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser, isLoggedIn, updateProfile, fetchProfile } = useAuth();
  const { openModal } = useAuthModal();
  const { friends, sentRequests, sendFriendRequest } = useFriends();

  // viewedUser — the profile being displayed. Starts as the logged-in user,
  // then gets replaced by the fetched profile when viewing someone else.
  const [viewedUser, setViewedUser]       = useState(null);
  const [viewedUserLoading, setViewedUserLoading] = useState(!!routeUsername);

  // Derive isOwnProfile once we know both sides
  const isOwnProfile = !routeUsername || (loggedInUser?.id?.toString() === routeUsername);

  // The user object we actually seed the profile from
  const user = isOwnProfile ? loggedInUser : viewedUser;

  // Fetch the viewed user when a username param is present and it's not our own
  useEffect(() => {
    if (!routeUsername || isOwnProfile) {
      setViewedUserLoading(false);
      return;
    }
    setViewedUserLoading(true);
    apiService.getProfileById(routeUsername)
    .then(data => {
  console.log("viewedUser pfp:", data?.pfp);
  setViewedUser(data);
    })
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
  const [aboutPhoto, setAboutPhoto] = useState(null);
  const [name,       setName]       = useState("");
  const [location,   setLocation]   = useState("");
  const [city,       setCity]       = useState("");
  const [country,    setCountry]    = useState("");

  // ── Add Friend state — only relevant when viewing someone else's profile ──
  const [friendStatus, setFriendStatus] = useState("none"); // "none" | "pending" | "friends"

  // Seed friendStatus from the already-loaded friends + sent requests in FriendsContext
  useEffect(() => {
    if (isOwnProfile || !viewedUser?.user_id) return;
    const isFriend     = friends.some((f) => String(f.id) === String(viewedUser.user_id));
    const hasSentReq   = sentRequests.some((r) => String(r.toUser?.id) === String(viewedUser.user_id));
    setFriendStatus(isFriend ? "friends" : hasSentReq ? "pending" : "none");
  }, [friends, sentRequests, viewedUser?.user_id, isOwnProfile]);

  const handleAddFriend = async () => {
    if (!isLoggedIn) { openModal("login"); return; }
    if (friendStatus !== "none") return;
    setFriendStatus("pending");
    try {
      await sendFriendRequest(viewedUser.user_id);
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setFriendStatus("none");
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

  // Toggle a tag in the picker.
  // setPills is called OUTSIDE the setSelectedTagIds updater to avoid a stale
  // allTags closure — functional updaters must be pure (no side-effects).
  const toggleTag = (tag) => {
    const color = PILL_COLORS[tag.id % PILL_COLORS.length];
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tag.uid)) {
        next.delete(tag.uid);
      } else {
        next.add(tag.uid);
      }
      return next;
    });
    setPills((prevPills) => {
      if (prevPills.some((p) => p.id === tag.uid)) {
        return prevPills.filter((p) => p.id !== tag.uid);
      }
      return [...prevPills, { id: tag.uid, text: tag.name, color }];
    });
  };

  // Seed local edit form state from a user object.
  // Called on initial user load and whenever the modal is opened/cancelled to reset unsaved edits.
  const seedFormFromUser = (u) => {
    if (!u) return;
    setName(u.display_name || u.username || "");
    const parts = [u.city, u.country].filter(Boolean);
    setLocation(parts.join(", "));
    setCity(u.city || "");
    setCountry(u.country || "");
    setAbout(u.about || "");
    setProfilePic(u.pfp ? formatAvatarUrl(u.pfp) : null);
    setBanner(u.profile_banner ? formatAvatarUrl(u.profile_banner) : null);
    setLinks({
      spotify:    u.spotify    || "",
      soundcloud: u.soundcloud || "",
      bandcamp:   u.bandcamp   || "",
      youtube:    u.youtube    || "",
      instagram:  u.instagram  || "",
      tiktok:     u.tiktok     || "",
    });

    // Seed pills from genres, instruments, and vibes — color stable per tag.id.
    // Supabase (viewedUser) returns flattened arrays as .genres/.instruments/.vibes
    // Django (loggedInUser) returns them as .genres_liked/.instruments_liked/.vibes_liked
    // PATCH responses return tag arrays as bare IDs (not objects) — skip pill update in that case
    // so the locally-toggled state isn't wiped. fetchProfile() always returns full objects.
    const colors = ["#DC2E73", "#7C3AED", "#0891B2", "#EA580C", "#16A34A", "#CA8A04"];
    const rawGenres      = u.genres      ?? u.genres_liked      ?? [];
    const rawInstruments = u.instruments ?? u.instruments_liked ?? [];
    const rawVibes       = u.vibes       ?? u.vibes_liked       ?? [];
    // Only update pills if every item in every array is a full object (has .name).
    // [].every() is vacuously true, so empty arrays from a real fetch still clear the pills correctly.
    const hasFullObjects = rawGenres.every(t => typeof t === "object" && t?.name)
                        && rawInstruments.every(t => typeof t === "object" && t?.name)
                        && rawVibes.every(t => typeof t === "object" && t?.name);
    if (hasFullObjects) {
      const userTags = [
        ...rawGenres.filter(t => t?.id && t?.name).map(t => ({ ...t, uid: `g_${t.id}` })),
        ...rawInstruments.filter(t => t?.id && t?.name).map(t => ({ ...t, uid: `i_${t.id}` })),
        ...rawVibes.filter(t => t?.id && t?.name).map(t => ({ ...t, uid: `v_${t.id}` })),
      ];
      setPills(userTags.map((tag) => ({
        id: tag.uid,
        text: tag.name,
        color: colors[tag.id % colors.length],
      })));
      setSelectedTagIds(new Set(userTags.map((t) => t.uid)));
    }
  };

  // Seed from user whenever it resolves (initial load / after save re-fetch).
  useEffect(() => {
    if (!user) return;
    seedFormFromUser(user);
  }, [user]);


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

  // ── Social / artist links ────────────────────────────────────────────────────
  const EMPTY_LINKS = { spotify: "", soundcloud: "", bandcamp: "", youtube: "", instagram: "", tiktok: "" };
  const [links, setLinks] = useState(EMPTY_LINKS);

  const [globalTextOverride, setGlobalTextOverride] = useState(null);
  const [interestsExpanded, setInterestsExpanded] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
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
  const [isSaving, setIsSaving] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    title: "",
    audioFile: null,
    audioName: null,
  });

  const [playingIndex, setPlayingIndex] = useState(null);

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

  // ── Posts state ───────────────────────────────────────────────────────────
  const audioRef = useRef(null);

  // ── Jams state — fetched from jamService, capped at 9, local-only removal ──
  const [jams, setJams] = useState([]);
  const [jamsLoading, setJamsLoading] = useState(true);
  const [hostedJamsCount, setHostedJamsCount] = useState(0);

  useEffect(() => {
    const jamUserId = isOwnProfile ? loggedInUser?.id : viewedUser?.user_id;
    if (!jamUserId) return;
    setJamsLoading(true);
    Promise.all([
      jamService.getMyAttendingJams(jamUserId, null),
      jamService.getMyCreatedJams(jamUserId, null),
    ])
      .then(([attending, created]) => {
        setHostedJamsCount(created.length);
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
  }, [isOwnProfile, loggedInUser?.id, viewedUser?.user_id]);


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
    const postsUserId = isOwnProfile ? loggedInUser?.id : viewedUser?.user_id;
    if (!postsUserId) return;
    setProfilePostsLoading(true);
    postService.getPostsByUser(postsUserId, loggedInUser?.id, 5)
      .then(setProfilePosts)
      .catch(console.error)
      .finally(() => setProfilePostsLoading(false));
  }, [isOwnProfile, loggedInUser?.id, viewedUser?.user_id]);

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

  const normalizeSnip = (s) => ({
    ...s,
    title:     s.name      ?? s.title ?? "",
    audio:     formatAvatarUrl(s.musicFile) ?? s.audio ?? null,
    audioName: s.name      ?? s.title ?? "",
  });

  useEffect(() => {
    const profileUserId = isOwnProfile ? loggedInUser?.id : viewedUser?.user_id;
    if (!profileUserId) return;
    musicSnipService.getProfileSnips(profileUserId)
      .then((snips) => setSnippets(snips.map(normalizeSnip)))
      .catch(console.error);
  }, [loggedInUser?.id, viewedUser?.user_id, isOwnProfile]);

  const saveSnippet = async () => {
    if (isSaving) return;

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

    setIsSaving(true);
    try {
      const saved = await musicSnipService.createSnip({ name: newSnippet.title, musicFile: newSnippet.audioFile });
      setNewSnippet({ title: "", audioFile: null, audioName: null });
      setSnippetModalOpen(false);

      // Optimistic add so the snippet appears immediately without waiting for a re-fetch
      setSnippets((prev) => {
        if (saved?.id && prev.some((s) => s.id === saved.id)) return prev;
        return [...prev, normalizeSnip(saved)];
      });
    } catch (err) {
      showToast("Failed to save snippet.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSnippet = async (indexToDelete) => {
    const target = snippets[indexToDelete];

    if (target?.id) {
      try {
        await musicSnipService.deleteSnip(target.id);
      } catch (err) {
        showToast("Failed to delete snippet.");
        return;
      }
    }

    if (target) revokeObjectUrl(target.audio);
    setSnippets((prev) => prev.filter((_, i) => i !== indexToDelete));

    if (playingIndex === indexToDelete) {
      stopPlayback();
    } else if (playingIndex !== null && playingIndex > indexToDelete) {
      setPlayingIndex((prev) => (prev === null ? null : prev - 1));
    }
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

  // Lock body scroll whenever any modal is open so the page can't scroll behind it.
  const anyModalOpen = editOpen || snippetModalOpen || pillPickerOpen || pillViewerOpen || !!selectedJam || !!selectedPost;
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
        <p className="text-sm text-white/40">No user found with username @{routeUsername}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-neutral-900/50 backdrop-blur-2xl text-white flex flex-col">
      <main className="mx-auto w-full max-w-[1400px] pb-8">

        {/* ─────────────────────────── BANNER ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full overflow-hidden rounded-b-2xl group/banner"
          style={{
            height: "160px",
            background: banner
              ? `url(${banner}) center/cover no-repeat`
              : "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.55)",
          }}
        >
          {banner && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          )}
          {isOwnProfile && (
            <div
              className="absolute inset-0 z-20 flex items-end justify-center pb-4 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={() => { setEditOpen(true); setActiveSection("Banner"); }}
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 65%)" }}
            >
              <div
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Change Banner
              </div>
            </div>
          )}
        </motion.div>

        {/* ── AVATAR + IDENTITY HEADER ─────────────────────────────────────────── */}
        {/* Avatar bleeds above the content area via negative margin-top          */}
        <div className="px-4 md:px-6 relative z-30" style={{ marginTop: "-50px" }}>
          <div className="flex items-end justify-between gap-4">

            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
              className={`w-[96px] h-[96px] shrink-0 rounded-full relative overflow-hidden group/avatar${isOwnProfile ? " cursor-pointer" : ""}`}
              onClick={isOwnProfile ? () => { setEditOpen(true); setActiveSection("Profile Picture"); } : undefined}
              style={{
                background: "linear-gradient(135deg, #DC2E73 0%, #7C3AED 100%)",
                border: "3px solid #111",
                boxShadow: "0 4px 20px rgba(0,0,0,0.65)",
              }}
            >
              {(() => {
                const avatarSrc = profilePic || formatAvatarUrl(user?.pfp);
                return avatarSrc ? (
                  <img src={avatarSrc} alt={name || "avatar"} className="w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white select-none">
                    {(name || "?")[0].toUpperCase()}
                  </span>
                );
              })()}
              {isOwnProfile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
              )}
            </motion.div>

            {/* CTAs — right side, aligned to avatar baseline */}
            <div className="flex items-center gap-2 pb-1">
              {!isOwnProfile && !editOpen && (
                <>
                  {isLoggedIn && viewedUser?.user_id && friendStatus === "friends" && (
                    <button
                      onClick={() => navigate("/chat", { state: { openDmWith: { id: viewedUser.user_id, displayName: viewedUser.display_name || viewedUser.username || "", username: viewedUser.username || "", avatarUrl: formatAvatarUrl(viewedUser.pfp) || null } } })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.80)", backdropFilter: "blur(8px)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
                      Message
                    </button>
                  )}
                  {friendStatus === "friends" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(22,163,74,0.18)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", backdropFilter: "blur(8px)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Friends
                    </div>
                  ) : (
                    <button
                      onClick={handleAddFriend}
                      disabled={friendStatus === "pending"}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                      style={{
                        background: friendStatus === "pending" ? "rgba(255,255,255,0.10)" : "#DC2E73",
                        border: friendStatus === "pending" ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(220,46,115,0.6)",
                        color: friendStatus === "pending" ? "rgba(255,255,255,0.5)" : "#fff",
                        boxShadow: friendStatus === "none" ? "0 0 20px rgba(220,46,115,0.35)" : "none",
                        cursor: friendStatus === "pending" ? "default" : "pointer",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {friendStatus === "pending" ? (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Sent</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/><path d="M20 8v3M18.5 9.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>Add Friend</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── IDENTITY + HERO LINKS — two-column at lg ─────────────────────── */}
          <div className="mt-3 flex flex-col lg:flex-row lg:items-start gap-x-6">

            {/* Left: name + identity */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.14 }}
              className="flex-1 min-w-0"
            >
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-4xl font-black tracking-tight text-white leading-none">{name || "—"}</h1>
              {user?.username && (
                <span className="text-sm text-white/30 font-medium">@{user.username}</span>
              )}
            </div>
            {location && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-40">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
                <span className="text-xs text-white/40">{location}</span>
              </div>
            )}
            {/* Primary instrument / genre / vibe identity chips */}
            {(() => {
              const topInstrument = pills.find(p => typeof p.id === "string" && p.id.startsWith("i_"));
              const topGenre      = pills.find(p => typeof p.id === "string" && p.id.startsWith("g_"));
              const topVibe       = pills.find(p => typeof p.id === "string" && p.id.startsWith("v_"));
              const chips = [topInstrument, topGenre, topVibe].filter(Boolean);
              return (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {chips.map(chip => (
                    <span
                      key={chip.id}
                      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: chip.color + "18", border: `1px solid ${chip.color}38`, color: chip.color }}
                    >
                      <span style={{ fontSize: "11px" }}>{getPillEmoji(chip.text)}</span>
                      {chip.text}
                    </span>
                  ))}
                  {user?.skill_level && (
                    <span className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.38)" }}>
                      {user.skill_level}
                    </span>
                  )}
                </div>
              );
            })()}

              {/* ── Edit Profile CTA ─────────────────────────────────────── */}
              {isOwnProfile && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => { setEditOpen(true); setActiveSection("Name & Location"); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:brightness-110"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.13)",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                      <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit Profile
                  </button>
                </div>
              )}
            </motion.div>

            {/* Right: hero links — renders null when no active links */}
            <HeroLinks links={links} isOwnProfile={isOwnProfile} />

          </div>{/* end identity + hero links */}
        </div>

        {/* ── TWO-COLUMN BODY ──────────────────────────────────────────────────── */}
        <div className="mt-5 px-4 md:px-6 flex flex-col lg:flex-row gap-4 lg:items-start">

          {/* ════════════════════════════════════════════════════════════════════
              LEFT SIDEBAR — stats + sound identity
          ════════════════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[272px] shrink-0 flex flex-col gap-3">

            {/* ── PROFILE METADATA ───────────────────────────────────────────── */}
            {(() => {
              const joinedRaw   = user?.date_joined ?? user?.created_at ?? user?.joined_at ?? null;
              const memberSince = joinedRaw
                ? new Date(joinedRaw).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : null;
              const totalJams = jams.length;
              const liveJams  = jams.filter(j => j.isLive).length;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.10 }}
                  className="rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Live badge */}
                  {liveJams > 0 && (
                    <span className="self-start flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold"
                      style={{ background: "rgba(220,46,115,0.18)", border: "1px solid rgba(220,46,115,0.35)", color: "#DC2E73" }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#DC2E73" }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#DC2E73]" />
                      </span>
                      {liveJams} Live Now
                    </span>
                  )}
                  {/* Jam stat numbers */}
                  {(totalJams > 0 || hostedJamsCount > 0) && (
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-white leading-none">{totalJams}</span>
                        <span className="text-[10px] text-white/35 mt-0.5">Jams</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-white leading-none">{hostedJamsCount}</span>
                        <span className="text-[10px] text-white/35 mt-0.5">Hosted</span>
                      </div>
                      {snippets.length > 0 && (
                        <>
                          <div className="w-px h-6 bg-white/10" />
                          <div className="flex flex-col">
                            <span className="text-xl font-black text-white leading-none">{snippets.length}</span>
                            <span className="text-[10px] text-white/35 mt-0.5">Clips</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {/* Member since */}
                  {memberSince && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-35">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs text-white/40">Member since {memberSince}</span>
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* ── SOUND / INTERESTS ──────────────────────────────────────────── */}
            {(() => {
              const CATEGORIES = [
                { key: "g", label: "Genres" },
                { key: "i", label: "Instruments" },
                { key: "v", label: "Vibes" },
              ];
              const grouped = CATEGORIES.map(cat => ({
                ...cat,
                pills: pills.filter(p => typeof p.id === "string" && p.id.startsWith(cat.key + "_") && p.text),
              })).filter(cat => cat.pills.length > 0);

              const MAX_PER_CAT = 4;
              const totalHidden = interestsExpanded
                ? 0
                : grouped.reduce((acc, cat) => acc + Math.max(0, cat.pills.length - MAX_PER_CAT), 0);

              if (grouped.length === 0 && !isOwnProfile) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
                  className="rounded-2xl p-4 backdrop-blur-md flex flex-col gap-3"
                  style={{
                    background: cardColors.interests.bg,
                    border: `1px solid ${cardColors.interests.border}`,
                    boxShadow: `0 2px 16px ${cardColors.interests.glow}`,
                    transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                  }}
                >
                  {(() => {
                    const dark       = needsDarkText(cardColors.interests.bg, cardTextOverrides.interests);
                    const textLabel  = dark ? "rgba(0,0,0,0.40)"  : "rgba(255,255,255,0.35)";
                    const dividerCol = dark ? "rgba(0,0,0,0.10)"  : "rgba(255,255,255,0.07)";
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textLabel }}>Sound</span>
                          {isOwnProfile && (
                            <button
                              onClick={async () => {
                                setPillPickerOpen(true);
                                if (allTags.length === 0) {
                                  setTagsLoading(true);
                                  try {
                                    const { genres, instruments, vibes } = await apiService.getAllFormOptions();
                                    setAllTags([
                                      ...(genres ?? []).map(t => ({ ...t, uid: `g_${t.id}` })),
                                      ...(instruments ?? []).map(t => ({ ...t, uid: `i_${t.id}` })),
                                      ...(vibes ?? []).map(t => ({ ...t, uid: `v_${t.id}` })),
                                    ]);
                                    setSelectedTagIds(new Set(pills.map(p => p.id).filter(Boolean)));
                                  } catch (err) { console.error("Failed to fetch tags:", err); }
                                  finally { setTagsLoading(false); }
                                } else {
                                  setSelectedTagIds(new Set(pills.map(p => p.id).filter(Boolean)));
                                }
                              }}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                              style={{ color: "#DC2E73", background: "rgba(220,46,115,0.10)", border: "1px solid rgba(220,46,115,0.20)" }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {grouped.length === 0 ? (
                          <p className="text-xs" style={{ color: textLabel }}>
                            {isOwnProfile ? "Tap Edit to add your genres, instruments & vibes" : "No tags yet"}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            {grouped.map((cat, catIdx) => {
                              const visible = interestsExpanded ? cat.pills : cat.pills.slice(0, MAX_PER_CAT);
                              return (
                                <div key={cat.key} className="flex flex-col gap-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textLabel }}>{cat.label}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {visible.map(pill => (
                                      <span key={pill.id} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                                        style={{ background: pill.color + "18", border: `1px solid ${pill.color}30`, color: pill.color }}>
                                        <span style={{ fontSize: "10px" }}>{getPillEmoji(pill.text)}</span>
                                        {pill.text}
                                      </span>
                                    ))}
                                  </div>
                                  {catIdx < grouped.length - 1 && (
                                    <div style={{ height: "1px", background: dividerCol, marginTop: "2px" }} />
                                  )}
                                </div>
                              );
                            })}
                            {totalHidden > 0 && (
                              <button onClick={() => isOwnProfile ? setInterestsExpanded(true) : setPillViewerOpen(true)}
                                className="self-start text-[11px] font-medium transition-all hover:opacity-80"
                                style={{ color: textLabel }}>
                                +{totalHidden} more
                              </button>
                            )}
                            {interestsExpanded && (
                              <button onClick={() => setInterestsExpanded(false)}
                                className="self-start text-[11px] transition-all hover:opacity-80"
                                style={{ color: textLabel }}>
                                Show less ↑
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              );
            })()}

          </div>{/* end LEFT SIDEBAR */}

          {/* ════════════════════════════════════════════════════════════════════
              RIGHT CONTENT COLUMN — music clips, bio, jams, posts
          ════════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* ── MUSIC CLIPS — hidden on other-profile when empty ───────────── */}
            {(snippets.length > 0 || isOwnProfile) && <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: "easeOut", delay: 0.08 }}
              className="rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.musicSnips.bg,
                border: `1px solid ${cardColors.musicSnips.border}`,
                boxShadow: `0 2px 20px ${cardColors.musicSnips.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {(() => {
                const dark        = needsDarkText(cardColors.musicSnips.bg, cardTextOverrides.musicSnips);
                const textPrimary = dark ? "#111"             : "#fff";
                const textDim     = dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";
                return (
                  <>
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.40)", transition: "color 0.4s ease" }}>
                          Music Clips
                        </h2>
                        {snippets.length > 0 && (
                          <span className="text-[10px] font-medium" style={{ color: dark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }}>
                            {snippets.length}/{MAX_SNIPPETS}
                          </span>
                        )}
                      </div>
                      {isOwnProfile && snippets.length > 0 && snippets.length < MAX_SNIPPETS && (
                        <button
                          onClick={() => setSnippetModalOpen(true)}
                          className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200 hover:brightness-125"
                          style={{
                            background: dark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.09)",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1v10M1 6h10" stroke={dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)"} strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {snippets.length === 0 ? (
                        isOwnProfile ? (
                          <button
                            onClick={() => setSnippetModalOpen(true)}
                            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-8 transition-all duration-200 hover:opacity-80"
                            style={{
                              border: `1px dashed ${dark ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.12)"}`,
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <span style={{ fontSize: "24px" }}>🎙️</span>
                            <span className="text-sm font-medium" style={{ color: textDim }}>Share a recording</span>
                            <span className="text-xs" style={{ color: textDim, opacity: 0.6 }}>Let people hear what you play</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <span style={{ fontSize: "22px", opacity: 0.25 }}>🎵</span>
                            <p className="text-sm" style={{ color: textDim }}>No clips yet</p>
                          </div>
                        )
                      ) : (
                        snippets.map((snippet, index) => {
                          const isPlaying = playingIndex === index;
                          return (
                            <div key={index} className="relative group/snip">
                              {!isPlaying && (
                                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30
                                  opacity-0 group-hover/snip:opacity-100 transition-opacity duration-200
                                  bg-neutral-800 text-white text-[11px] px-3 py-1 whitespace-nowrap"
                                  style={{ borderRadius: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                                  Click to play
                                </div>
                              )}
                              <div
                                onClick={() => playSnippet(snippet, index)}
                                className={`relative z-10 flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition-colors${isPlaying ? " snip-playing-glow" : ""}`}
                                style={{
                                  background: isPlaying ? "rgba(220,46,115,0.12)" : (dark ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"),
                                  border: isPlaying ? "1px solid rgba(220,46,115,0.30)" : `1px solid ${dark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.08)"}`,
                                  backgroundImage: snippet.background
                                    ? `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url(${snippet.background})`
                                    : undefined,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              >
                                {/* Play / Pause button */}
                                <div className="shrink-0 flex items-center justify-center rounded-xl transition-colors duration-200"
                                  style={{
                                    width: "36px", height: "36px",
                                    background: isPlaying ? "#DC2E73" : (dark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.08)"),
                                    border: isPlaying ? "none" : `1px solid ${dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.10)"}`,
                                  }}
                                >
                                  {isPlaying ? (
                                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                                      <rect x="0" y="0" width="3" height="12" rx="1.5"/>
                                      <rect x="7" y="0" width="3" height="12" rx="1.5"/>
                                    </svg>
                                  ) : (
                                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                                      <path d="M1 1l8 5-8 5V1z" fill={dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)"}/>
                                    </svg>
                                  )}
                                </div>
                                {/* Title + waveform bars */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                  <span className="text-sm font-semibold truncate"
                                    style={{ color: isPlaying ? "#DC2E73" : textPrimary }}>
                                    {snippet.title}
                                  </span>
                                  {/* Waveform — static bars, animate during playback */}
                                  <div className="flex items-end gap-[2px]" style={{ height: "12px" }}>
                                    {[3,6,4,8,5,10,7,5,9,6,4,7,5,8,4,6,3,7,5,9].map((h, i) => (
                                      <div key={i} className="rounded-full"
                                        style={{
                                          width: "2px", height: `${h}px`,
                                          background: isPlaying
                                            ? `rgba(220,46,115,${0.45 + (i % 3) * 0.18})`
                                            : (dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.12)"),
                                          animation: isPlaying ? `waveform-bounce ${0.6 + (i % 4) * 0.15}s ease-in-out infinite` : "none",
                                          animationDelay: isPlaying ? `${i * 0.055}s` : "0s",
                                          transformOrigin: "bottom",
                                          transition: "background 0.3s ease",
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {/* Delete button (own profile) or playing dot */}
                                {isOwnProfile ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteSnippet(index); }}
                                    className="shrink-0 flex items-center justify-center rounded-full transition-all duration-200 opacity-0 group-hover/snip:opacity-100 hover:!opacity-100"
                                    style={{
                                      width: "24px", height: "24px",
                                      background: "rgba(220,46,115,0.00)",
                                      color: dark ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.25)",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = "#DC2E73"; e.currentTarget.style.background = "rgba(220,46,115,0.12)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = dark ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(220,46,115,0.00)"; }}
                                  >
                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                                      <path d="M1 3h10M4 3V2h4v1M5 6v4M7 6v4M2 3l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L10 3H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                ) : (
                                  <div className="shrink-0 h-2 w-2 rounded-full transition-colors duration-200"
                                    style={{ background: isPlaying ? "#DC2E73" : (dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.12)") }} />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>}
            {/* end music clips guard */}

            {/* ── ABOUT ME — hidden on other-profile when no bio ──────────────── */}
            {(about || isOwnProfile) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: "easeOut", delay: 0.12 }}
              className="rounded-2xl p-5 backdrop-blur-md"
              style={{
                background: cardColors.aboutMe.bg,
                border: `1px solid ${cardColors.aboutMe.border}`,
                boxShadow: `0 2px 20px ${cardColors.aboutMe.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {(() => {
                const dark      = needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe);
                const textLabel = dark ? "rgba(0,0,0,0.40)"  : "rgba(255,255,255,0.35)";
                const textBody  = dark ? "#444"              : "#d4d4d4";
                const textEmpty = dark ? "rgba(0,0,0,0.25)"  : "rgba(255,255,255,0.2)";
                return (
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: textLabel, transition: "color 0.4s ease" }}>About</span>
                        {isOwnProfile && about && (
                          <button
                            onClick={() => { setEditOpen(true); setActiveSection("About Me"); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all hover:opacity-80"
                            style={{ color: "#DC2E73", background: "rgba(220,46,115,0.10)", border: "1px solid rgba(220,46,115,0.20)" }}
                          >
                            <svg width="8" height="8" viewBox="0 0 13 13" fill="none">
                              <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </button>
                        )}
                      </div>
                      {about ? (
                        <>
                          <p
                            className={`text-sm leading-relaxed${bioExpanded ? "" : " line-clamp-4"}`}
                            style={{ color: textBody, transition: "color 0.4s ease" }}
                          >{about}</p>
                          {about.length > 120 && (
                            <button
                              onClick={() => setBioExpanded(v => !v)}
                              className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70"
                              style={{ color: "#DC2E73" }}
                            >
                              {bioExpanded ? "Show less ↑" : "Read more ↓"}
                            </button>
                          )}
                        </>
                      ) : isOwnProfile ? (
                        <button
                          onClick={() => { setEditOpen(true); setActiveSection("About Me"); }}
                          className="flex flex-col items-start gap-1 w-full text-left rounded-xl p-3 transition-all duration-200 hover:opacity-80"
                          style={{
                            border: `1px dashed ${dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.10)"}`,
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: dark ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.30)" }}>
                            Write your story...
                          </span>
                          <span className="text-xs" style={{ color: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.15)" }}>
                            Tell people about your musical journey
                          </span>
                        </button>
                      ) : (
                        <p className="text-sm italic" style={{ color: textEmpty, transition: "color 0.4s ease" }}>
                          No bio yet.
                        </p>
                      )}
                    </div>
                    {aboutPhoto && (
                      <div className="shrink-0 self-start">
                        <div className="w-[80px] h-[100px] rounded-xl overflow-hidden border-4 border-white/80 shadow-lg"
                          style={{ transform: "rotate(5deg)", backgroundImage: `url(${aboutPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
            )}{/* end about guard */}

            {/* ── JAMS ───────────────────────────────────────────────────────── */}
            {(() => {
              const dark = needsDarkText(cardColors.jams.bg, cardTextOverrides.jams);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: "easeOut", delay: 0.16 }}
                  className="rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4"
                  style={{
                    background: cardColors.jams.bg,
                    border: `1px solid ${cardColors.jams.border}`,
                    boxShadow: `0 2px 20px ${cardColors.jams.glow}`,
                    transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.40)", transition: "color 0.4s ease" }}>Jams</h2>
                    {jams.length > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: dark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)" }}>
                        {jams.length}
                      </span>
                    )}
                  </div>
                  {jamsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
                    </div>
                  ) : jams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
                        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.6"/>
                        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.6"/>
                      </svg>
                      <p className="text-sm" style={{ color: dark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}>No jams yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {jams.map((jam) => {
                        const isPast       = jam.timeSlot === "past";
                        const color        = getDiscoveryAccentColor(jam);
                        const glyph        = DISCOVERY_VARIANTS[jam.type]?.markerGlyph ?? "J";
                        const dateLine     = jam.dateTime ?? jam.metaSecondary ?? jam.date;
                        return (
                          <div key={jam.id} className="relative">
                            <div
                              onClick={() => setSelectedJam(jam)}
                              className="group relative z-10 w-full rounded-2xl p-4 text-left cursor-pointer select-none overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.15]"
                              style={{
                                background: jam.canEdit
                                  ? "linear-gradient(135deg, rgba(220,46,115,0.08), rgba(220,46,115,0.03))"
                                  : "rgba(255,255,255,0.04)",
                                border: jam.canEdit
                                  ? "1px solid rgba(220,46,115,0.20)"
                                  : "1px solid rgba(255,255,255,0.07)",
                                opacity: isPast ? 0.55 : 1,
                              }}
                            >
                              <div className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full opacity-35" style={{ background: color }} />
                              <div className="pl-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: hexToRgba(color, 0.14), color }}>
                                    {glyph}
                                  </div>
                                  <JamTypeBadge type={jam.type} />
                                  <div className="ml-auto"><JamStatusPill item={jam} /></div>
                                </div>
                                <h3 className="text-[13px] font-bold text-white mb-1 leading-snug line-clamp-2">{jam.title}</h3>
                                {dateLine && <p className="text-[11px] text-neutral-400">{dateLine}</p>}
                                {jam.locationName && <p className="text-[10px] text-neutral-600 mt-0.5 truncate">{jam.locationName}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* ── LINKS ──────────────────────────────────────────────────────── */}
            {(LINK_PLATFORMS.some(p => links[p.key]) || isOwnProfile) && (
              <ProfileLinksCard
                links={links}
                isOwnProfile={isOwnProfile}
                onEditClick={() => { setEditOpen(true); setActiveSection("Links"); }}
              />
            )}

            {/* ── POSTS ──────────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: "easeOut", delay: 0.20 }}
              className="rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.posts.bg,
                border: `1px solid ${cardColors.posts.border}`,
                boxShadow: `0 2px 20px ${cardColors.posts.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {(() => {
                const dark       = needsDarkText(cardColors.posts.bg, cardTextOverrides.posts);
                const textPrimary = dark ? "#111"             : "#fff";
                const textMid     = dark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)";
                const textDimmer  = dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.22)";
                const dividerCol  = dark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
                return (
                  <>
                    <div className="flex items-center justify-between shrink-0">
                      <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.40)", transition: "color 0.4s ease" }}>Posts</h2>
                      <Link to="/feed" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: textMid }}>
                        Feed →
                      </Link>
                    </div>
                    {profilePostsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: "rgba(220,46,115,0.4)", borderTopColor: "transparent" }} />
                      </div>
                    ) : profilePosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <span style={{ fontSize: "22px", opacity: 0.25 }}>💬</span>
                        <p className="text-sm" style={{ color: textDimmer }}>
                          {isOwnProfile ? "You haven't posted yet." : `${name || "This user"} hasn't posted yet.`}
                        </p>
                        <Link to="/feed" className="text-xs font-semibold mt-1 transition-opacity hover:opacity-70"
                          style={{ color: "#DC2E73" }}>
                          Check the Feed →
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {profilePosts.map((post, i) => (
                          <div key={post.id}>
                            {i > 0 && <div style={{ height: "1px", background: dividerCol }} />}
                            <div
                              className="flex gap-3 py-3 px-2 -mx-2 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.03]"
                              onClick={() => setSelectedPost(post)}
                            >
                              {post.author.avatarUrl ? (
                                <img src={post.author.avatarUrl} alt={post.author.displayName}
                                  className="w-8 h-8 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ background: "linear-gradient(135deg,rgba(220,46,115,0.35),rgba(251,64,64,0.2))", color: "#DC2E73" }}>
                                  {post.author.displayName?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: textPrimary }}>{post.author.displayName}</span>
                                  <span className="text-[10px]" style={{ color: textDimmer }}>{timeAgo(post.createdAt)}</span>
                                </div>
                                {(() => {
                                  const eventLink   = extractEventLink(post.content);
                                  const displayText = eventLink ? stripEventLink(post.content) : post.content;
                                  return (
                                    <>
                                      {displayText && (
                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: textMid }}>{displayText}</p>
                                      )}
                                      {eventLink ? (
                                        <div className="mt-2">
                                          <EventInviteCard type={eventLink.type} id={eventLink.id} compact={false} />
                                        </div>
                                      ) : post.media?.images?.[0] && (
                                        <img src={post.media.images[0]} alt="" className="mt-2 w-full max-h-32 object-cover rounded-lg" />
                                      )}
                                    </>
                                  );
                                })()}
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px]" style={{ color: textDimmer }}>♥ {post.likes}</span>
                                  <span className="text-[10px]" style={{ color: textDimmer }}>💬 {post.comments}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>

          </div>{/* end RIGHT CONTENT COLUMN */}

        </div>{/* end two-column body */}
      </main>


      {createPortal(
        <>
          <EventDetailModal
            item={selectedJam}
            open={!!selectedJam}
            onClose={() => setSelectedJam(null)}
            viewerContext={{ isCreator: selectedJam?.canEdit ?? false }}
            openedFrom="profile"
          />

      {/* ── Post Modal — full FeedPost card in a modal shell ─────────────── */}
      {selectedPost && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
          <div
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />
          <div
            className="relative z-10 w-full max-w-[560px] max-h-[88vh] overflow-y-auto hide-scrollbar rounded-2xl"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.9)",
              animation: "stubSlideIn 0.26s cubic-bezier(0.4,0,0.2,1) forwards",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button — sits above the card */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
            <FeedPost post={selectedPost} />
          </div>
        </div>
      )}

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
                <p className="text-xs text-neutral-600 mt-0.5">Pick any tags that describe your music</p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
              >
                {allTags.length > 0 ? allTags.filter(t => selectedTagIds.has(t.uid)).length : selectedTagIds.size} selected
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
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={false} color={color} onToggle={() => toggleTag(tag)} />;
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
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={false} color={color} onToggle={() => toggleTag(tag)} />;
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
                        const color = PILL_COLORS[tag.id % PILL_COLORS.length];
                        return <PillToggleButton key={tag.uid} tag={tag} selected={selected} atMax={false} color={color} onToggle={() => toggleTag(tag)} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 pb-5 pt-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={async () => {
                  setPillPickerOpen(false);
                  // If opened directly from the Sound section (not from the Edit Profile modal),
                  // save immediately — there's no "Save Changes" button for the user to hit.
                  if (!editOpen) {
                    const orderedGenreIds      = [...selectedTagIds].filter(uid => uid.startsWith("g_")).map(uid => +uid.slice(2));
                    const orderedInstrumentIds = [...selectedTagIds].filter(uid => uid.startsWith("i_")).map(uid => +uid.slice(2));
                    const orderedVibeIds       = [...selectedTagIds].filter(uid => uid.startsWith("v_")).map(uid => +uid.slice(2));
                    try {
                      await updateProfile({
                        genres_liked:      orderedGenreIds,
                        instruments_liked: orderedInstrumentIds,
                        vibes_liked:       orderedVibeIds,
                      });
                      showToast("Sound updated!");
                      fetchProfile().catch((err) => console.error("Background re-fetch failed:", err));
                    } catch (err) {
                      console.error("Failed to save sound tags:", err);
                      showToast("Failed to save. Please try again.");
                    }
                  }
                }}
                className="w-full rounded-xl bg-[#DC2E73] py-2.5 text-sm font-semibold text-white hover:bg-pink-500 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal — own profile only */}
      {isOwnProfile && editOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            onClick={() => { seedFormFromUser(user); setEditOpen(false); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="relative z-[1000] w-full max-w-[500px] max-h-[88vh] flex flex-col bg-[#0f0f0f] text-white rounded-3xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <button
                onClick={() => { seedFormFromUser(user); setEditOpen(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {/* Section tabs */}
            <div className="flex items-center gap-1.5 px-5 py-3 overflow-x-auto hide-scrollbar shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { key: "Name & Location", label: "Identity" },
                { key: "Profile Picture", label: "Avatar" },
                { key: "Banner",          label: "Banner" },
                { key: "About Me",        label: "About" },
                { key: "Pills",           label: "Sound" },
                { key: "Card Colors",     label: "Theme" },
                { key: "Links",           label: "Links" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                  style={{
                    background: activeSection === key ? "rgba(220,46,115,0.18)" : "transparent",
                    border: `1px solid ${activeSection === key ? "rgba(220,46,115,0.40)" : "rgba(255,255,255,0.09)"}`,
                    color: activeSection === key ? "#DC2E73" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5">
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
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
                  >
                    <i className="fa-solid fa-upload text-sm"></i>
                    <span className="text-sm font-medium">Upload Image</span>
                  </label>

                  <p className="text-center text-xs text-neutral-500">
                    PNG, JPG recommended
                  </p>
                  {profilePic && (
                    <div className="flex justify-center">
                      <div
                        className="w-20 h-20 rounded-full border-2 border-white/10 bg-cover bg-center"
                        style={{ backgroundImage: `url(${profilePic})` }}
                      />
                    </div>
                  )}
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
                </div>
              )}

              {activeSection === "About Me" && (
                <div className="flex flex-col gap-4">
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
                    {pills.length} selected — click the strip to edit
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
                    label="Sound"
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

              {activeSection === "Links" && (
                <LinksEditSection
                  links={links}
                  onChange={(key, val) => setLinks((prev) => ({ ...prev, [key]: val }))}
                />
              )}

            </div>
            {/* Drawer footer */}
            <div className="px-6 py-4 shrink-0 flex gap-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {/* ▼▼▼ SAVE — calls updateProfile() → PATCH api/profiles/me/ ▼▼▼ */}
              <button
                onClick={async () => {
                  // ── Build tag ID arrays from selectedTagIds (always in sync with selection)
                  const orderedGenreIds      = [...selectedTagIds].filter(uid => uid.startsWith("g_")).map(uid => +uid.slice(2));
                  const orderedInstrumentIds = [...selectedTagIds].filter(uid => uid.startsWith("i_")).map(uid => +uid.slice(2));
                  const orderedVibeIds       = [...selectedTagIds].filter(uid => uid.startsWith("v_")).map(uid => +uid.slice(2));

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
                      pfp:                toBlob(profilePic),
                      genres_liked:       orderedGenreIds,
                      instruments_liked:  orderedInstrumentIds,
                      vibes_liked:        orderedVibeIds,
                      profile_banner:     toBlob(banner),
                      // about_photo:     toBlob(aboutPhoto),
                      ...links,
                    });
                    // Close immediately, then re-fetch in the background
                    showToast("Profile saved!");
                    setEditOpen(false);
                    fetchProfile().catch((err) => console.error("Background re-fetch failed:", err));
                  } catch (err) {
                    console.error("Failed to save profile:", err);
                    showToast("Failed to save. Please try again.");
                  }
                }}
                className="flex-1 rounded-full bg-[#DC2E73] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-pink-500 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => { seedFormFromUser(user); setEditOpen(false); }}
                className="rounded-full bg-neutral-800 px-4 py-2.5 text-sm text-white/50 cursor-pointer hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
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

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSnippetModalOpen(false);
                  setNewSnippet({ title: "", audioFile: null, audioName: null });
                  // Reset the file input so re-opening doesn't show a stale filename
                  const el = document.getElementById("snippetAudio");
                  if (el) el.value = "";
                }}
                disabled={isSaving}
                className="rounded-lg bg-neutral-700 px-4 py-2 text-sm hover:bg-neutral-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={saveSnippet}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ minWidth: "72px", justifyContent: "center" }}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
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
              revokeObjectUrl(banner);
              setBanner(dataURL);
            } else if (cropState.variant === "square") {
              if (aboutPhoto) URL.revokeObjectURL(aboutPhoto);
              setAboutPhoto(dataURL);
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
            {toast.toLowerCase().includes("fail") || toast.toLowerCase().includes("error") ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                <path d="M8 5v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="white"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
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