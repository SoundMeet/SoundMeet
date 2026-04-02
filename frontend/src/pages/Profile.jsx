import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useJams } from "../Context/JamContext";
import JamCard from "../components/ProfileJamCardShareholder";
import { isUpcoming, TRACKING_COLOR, ATTENDED_COLOR } from "../utils/jamUtils";
import PillInput from "../components/PillInput";
import CropperThings from "../components/CropperThings";
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

const Profile = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Name & Location");
  const [nameHover, setNameHover] = useState(false);

  // selectedJam holds the jam object the user clicked, or null when the
  // stub is closed. Driving open/closed from data (the jam itself) rather
  // than a separate boolean means the stub always has what it needs to render.
  const [selectedJam, setSelectedJam] = useState(null);

  const [profilePic, setProfilePic] = useState(null);
  const [banner,     setBanner]     = useState(null);
  const [about,      setAbout]      = useState("This is the location of the Bio");
  const [aboutPhoto, setAboutPhoto] = useState(null);
  const [name,       setName]       = useState("Your Name");
  const [location,   setLocation]   = useState("Location");

  // pills – array of { text, color } objects shown on the banner strip
  // and managed in the Pills edit section.
  const [pills, setPills] = useState([
    { text: "Jazz",     color: "#DC2E73" },
    { text: "Guitar",   color: "#7C3AED" },
    { text: "Lo-fi",    color: "#0891B2" },
    { text: "Bassist",  color: "#DC2E73" },
    { text: "Soul",     color: "#7C3AED" },
    { text: "Producer", color: "#0891B2" },
  ]);

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
  });
  const setCardColor = (card, color) =>
    setCardColors((prev) => ({ ...prev, [card]: color }));

  // cardTextOverrides – manual light/dark text override per card.
  // null = auto-detect from luminance. true = force dark text. false = force light text.
  const [cardTextOverrides, setCardTextOverrides] = useState({
    aboutMe:    null,
    musicSnips: null,
    jams:       null,
    posts:      null,
  });
  const toggleCardTextOverride = (card, autoDark) => {
    // Cycle: auto → opposite of auto → auto
    setCardTextOverrides((prev) => {
      if (prev[card] === null) return { ...prev, [card]: !autoDark };
      return { ...prev, [card]: null };
    });
  };

  // globalTextOverride – drives the two-button text color control.
  // null = auto per card. false = force light text all cards. true = force dark text all cards.
  const [globalTextOverride, setGlobalTextOverride] = useState(null);
  const setGlobalText = (val) => {
    setGlobalTextOverride(val);
    // Push the same value into all per-card overrides so needsDarkText is consistent
    setCardTextOverrides({ aboutMe: val, musicSnips: val, jams: val, posts: val });
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
  const [posts, setPosts]                   = useState([]);
  const [selectedPost, setSelectedPost]     = useState(null);
  const [postModalOpen, setPostModalOpen]   = useState(false);
  const [newPost, setNewPost]               = useState({ title: "", jamName: "", username: "", description: "", image: null });

  // ── Post drag state — horizontal swipe UP to delete (same pattern as jams)
  const [postDragging, setPostDragging]     = useState(null);
  const [postDragY,    setPostDragY]        = useState(0);
  const postDragStartYRef                   = useRef(0);
  const postLastDragYRef                    = useRef(0);
  const postMovedRef                        = useRef(false);
  const POST_DRAG_THRESHOLD                 = 100;

  const addPost = (post) => setPosts((prev) => [{ ...post, id: Date.now() }, ...prev]);
  const removePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  const handlePostDragStart = (postId, event) => {
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;
    postDragStartYRef.current = clientY;
    postLastDragYRef.current  = 0;
    postMovedRef.current      = false;
    setPostDragging(postId);
    setPostDragY(0);
  };

  const handlePostDragMove = (event) => {
    if (postDragging === null) return;
    const clientY  = event.touches?.[0]?.clientY ?? event.clientY;
    const distance = clientY - postDragStartYRef.current;
    // Only allow upward drag (negative values)
    const clamped  = Math.min(distance, 0);
    if (Math.abs(clamped) > 6) postMovedRef.current = true;
    postLastDragYRef.current = clamped;
    setPostDragY(clamped);
  };

  const handlePostDragEnd = () => {
    if (postDragging === null) return;
    const postId    = postDragging;
    const finalDist = postLastDragYRef.current;
    setPostDragging(null);
    setPostDragY(0);
    if (Math.abs(finalDist) >= POST_DRAG_THRESHOLD) {
      if (selectedPost?.id === postId) setSelectedPost(null);
      removePost(postId);
    }
  };

  const audioRef = useRef(null);

  const dragStartXRef = useRef(0);
  const lastDragXRef = useRef(0);
  const movedRef = useRef(false);

  // We destructure jams AND removeJam — Profile reads jams for display,
  // and calls removeJam when a drag passes the delete threshold.
  const { jams, removeJam } = useJams();

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

  const saveSnippet = () => {
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
    // Create a fresh blob URL from the File at save time — fully detached
    // from the file input so it will never be prematurely garbage collected.
    const audioUrl = URL.createObjectURL(newSnippet.audioFile);
    setSnippets((prev) => [...prev, { ...newSnippet, audio: audioUrl }]);
    setNewSnippet({ title: "", audioFile: null, audioName: null, background: null });
    setSnippetModalOpen(false);
  };

  const deleteSnippet = (indexToDelete) => {
    setSnippets((prev) => {
      const target = prev[indexToDelete];
      if (target) {
        revokeObjectUrl(target.audio);
        revokeObjectUrl(target.background);
      }
      return prev.filter((_, i) => i !== indexToDelete);
    });

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
    if (postDragging === null) return;
    const onMouseMove = (e) => handlePostDragMove(e);
    const onMouseUp   = ()  => handlePostDragEnd();
    const onTouchMove = (e) => handlePostDragMove(e);
    const onTouchEnd  = ()  => handlePostDragEnd();
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
  }, [postDragging]);

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

  return (
    <div className="min-h-screen bg-neutral-900/50 backdrop-blur-2xl text-white flex flex-col">
      <main className="mx-auto w-full max-w-[1600px] flex flex-col gap-8 px-4 py-6 md:px-6">
        {/* Header — fixed height, never grows */}
        <section className="w-full shrink-0">
          <div
            className="relative flex h-[260px] w-full items-center overflow-visible rounded-3xl bg-neutral-200 px-6 md:px-10"
            onMouseEnter={() => setNameHover(true)}
            onMouseLeave={() => setNameHover(false)}
            style={{
              backgroundImage: banner ? `url(${banner})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: (() => {
                const glows = [
                  cardColors.aboutMe.glow,
                  cardColors.musicSnips.glow,
                  cardColors.jams.glow,
                  cardColors.posts.glow,
                ];
                const accent = glows.find(g => !g.startsWith("rgba(0,0,0") && !g.startsWith("rgba(0, 0, 0")) ?? "rgba(236,72,153,0.8)";
                return `0 0 15px ${accent}, 0 10px 40px rgba(0,0,0,0.8)`;
              })(),
              transition: "box-shadow 0.4s ease",
            }}
          >
            {/* Single invisible button covers the whole banner — no dead spots */}
            <button
              onClick={() => setEditOpen(true)}
              className="absolute inset-0 z-30 cursor-pointer opacity-0"
              aria-label="Open profile editor"
            />

            <div className="relative z-10 flex items-center">
              <div
                className="h-[180px] w-[180px] rounded-full border-4 border-white/70 bg-cover bg-center shadow-lg md:h-[210px] md:w-[210px]"
                style={{
                  backgroundImage: profilePic ? `url(${profilePic})` : undefined,
                  backgroundColor: profilePic ? "transparent" : "#db2777",
                }}
              />

              {/* Name + location — icons fade in when banner is hovered */}
              <div className="ml-5 md:ml-8">
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl font-semibold md:text-3xl ${bannerDark ? "text-white" : "text-black"}`}>
                    {name}
                  </h1>
                  <svg
                    width="14" height="14" viewBox="0 0 13 13" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ opacity: nameHover ? 1 : 0, transition: "opacity 0.25s ease", flexShrink: 0 }}
                  >
                    <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke={bannerDark ? "white" : "#333"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-sm md:text-base ${bannerDark ? "text-white/80" : "text-neutral-700"}`}>
                    {location}
                  </p>
                  <svg
                    width="11" height="11" viewBox="0 0 13 13" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ opacity: nameHover ? 1 : 0, transition: "opacity 0.25s ease", flexShrink: 0 }}
                  >
                    <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke={bannerDark ? "rgba(255,255,255,0.7)" : "#555"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Two-column grid — scrolls naturally with the page ── */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-4">

            {/* About Me container */}
            <div
              className="h-[500px] rounded-3xl p-5 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.aboutMe.bg,
                border: `1px solid ${cardColors.aboutMe.border}`,
                boxShadow: `0 0 40px ${cardColors.aboutMe.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >

              {/* Pills strip at the top — shrink-0 so it never gets compressed */}
              {pills.length > 0 && (
                <div className="shrink-0 pill-fade w-full overflow-hidden rounded-full px-3 py-2 bg-white/5 border border-white/10">
                  <div
                    className="pill-track gap-2"
                    style={{ animation: `pill-scroll ${pills.length * 3.8}s cubic-bezier(0.37, 0, 0.63, 1) infinite` }}
                  >
                    {[...pills, ...pills].map((pill, i) => (
                      <span
                        key={i}
                        className="shrink-0 rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: pill.color,
                          border: `1px solid ${pill.color}cc`,
                          color: "#fff",
                          boxShadow: `0 0 0 1px ${pill.color}55, 0 2px 8px ${pill.color}66, 0 0 16px ${pill.color}33`,
                        }}
                      >
                        {pill.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  <p
                    className="text-sm leading-relaxed break-words"
                    style={{ color: needsDarkText(cardColors.aboutMe.bg, cardTextOverrides.aboutMe) ? "#444" : "#d4d4d4", transition: "color 0.4s ease" }}
                  >
                    {about}
                  </p>
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

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />

            {/* Your Music Snips container */}
            <div
              className="h-[500px] rounded-3xl p-5 backdrop-blur-md flex flex-col gap-4"
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
                  Your Music Snips
                </h2>
                {snippets.length > 0 && snippets.length < MAX_SNIPPETS && (
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
                  <button
                    onClick={() => setSnippetModalOpen(true)}
                    className="rounded-2xl border border-dashed border-neutral-600 bg-neutral-800 py-8 text-center text-neutral-400 transition hover:bg-neutral-700"
                  >
                    Add your first snippet
                  </button>
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

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-4">

            {/* Jams Attended container */}
            <div
              className="h-[500px] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.jams.bg,
                border: `1px solid ${cardColors.jams.border}`,
                boxShadow: `0 0 40px ${cardColors.jams.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              <div className="flex items-center justify-between shrink-0">
                <h2
                  className="text-2xl"
                  style={{ color: needsDarkText(cardColors.jams.bg, cardTextOverrides.jams) ? "#111" : "#fff", transition: "color 0.4s ease" }}
                >
                  Jams Attended
                </h2>
              </div>

              {jams.length === 0 ? (
                <Link
                  to="/jams"
                  className="flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm cursor-pointer"
                  style={{
                    borderColor: needsDarkText(cardColors.jams.bg, cardTextOverrides.jams) ? "rgba(0,0,0,0.2)" : "#404040",
                    background: needsDarkText(cardColors.jams.bg, cardTextOverrides.jams) ? "rgba(0,0,0,0.05)" : "rgba(23,23,23,0.5)",
                    color: needsDarkText(cardColors.jams.bg, cardTextOverrides.jams) ? "#666" : "#a3a3a3",
                  }}
                >
                  No jams yet. Create one!
                </Link>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar flex-1 min-h-0 pr-1">
                  {[...jams].sort((a, b) => isUpcoming(b.date) - isUpcoming(a.date)).map((jam) => (
                    <JamCard
                      key={jam.id}
                      jam={jam}
                      onSelect={setSelectedJam}
                      dragHandlers={{
                        onMouseDown:  (e) => handleJamDragStart(jam.id, e),
                        onTouchStart: (e) => handleJamDragStart(jam.id, e),
                      }}
                      isDragging={jamDragging === jam.id}
                      dragX={jamDragX}
                      movedRef={jamMovedRef}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />

            {/* Posts container */}
            <div
              className="h-[500px] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4"
              style={{
                background: cardColors.posts.bg,
                border: `1px solid ${cardColors.posts.border}`,
                boxShadow: `0 0 40px ${cardColors.posts.glow}`,
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between shrink-0">
                <h2
                  className="text-2xl"
                  style={{ color: needsDarkText(cardColors.posts.bg, cardTextOverrides.posts) ? "#111" : "#fff", transition: "color 0.4s ease" }}
                >
                  Posts
                </h2>
                {posts.length > 0 && (
                  <button
                    onClick={() => setPostModalOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white text-xl hover:bg-[#DC2E73] hover:border-[#DC2E73] transition-all duration-200 cursor-pointer"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Empty state */}
              {posts.length === 0 ? (
                <button
                  onClick={() => setPostModalOpen(true)}
                  className="flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm cursor-pointer"
                  style={{
                    borderColor: needsDarkText(cardColors.posts.bg, cardTextOverrides.posts) ? "rgba(0,0,0,0.2)" : "#404040",
                    background: needsDarkText(cardColors.posts.bg, cardTextOverrides.posts) ? "rgba(0,0,0,0.05)" : "rgba(23,23,23,0.5)",
                    color: needsDarkText(cardColors.posts.bg, cardTextOverrides.posts) ? "#666" : "#a3a3a3",
                  }}
                >
                  No posts yet. Create one!
                </button>
              ) : (
                /* Horizontal scroll row */
                <div className="flex flex-row gap-3 overflow-x-auto hide-scrollbar flex-1 min-w-0 pb-1">
                  {posts.map((post) => {
                    const isDragging    = postDragging === post.id;
                    const offsetY       = isDragging ? postDragY : 0;
                    const dragProgress  = Math.min(Math.abs(offsetY) / POST_DRAG_THRESHOLD, 1);

                    return (
                      <div key={post.id} className="relative shrink-0 w-[200px]">

                        {/* Drag overlay */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden z-10">
                          {isDragging && (
                            <div className="absolute inset-0 rounded-2xl bg-red-500/20" style={{ opacity: dragProgress }} />
                          )}
                          {isDragging && dragProgress > 0.45 && (
                            <div className="absolute inset-0 flex items-end justify-center pb-4">
                              <span className="text-xs font-medium text-red-300">Release to delete</span>
                            </div>
                          )}
                        </div>

                        {/* Post card — portrait ratio */}
                        <button
                          onMouseDown={(e) => handlePostDragStart(post.id, e)}
                          onTouchStart={(e) => handlePostDragStart(post.id, e)}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onClick={() => {
                            if (!postMovedRef.current) setSelectedPost(post);
                            postMovedRef.current = false;
                          }}
                          className="w-full text-left rounded-2xl bg-neutral-800 border border-white/10 overflow-hidden flex flex-col cursor-pointer"
                          style={{
                            height: "340px",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            touchAction: "pan-x",
                            transform: `translateY(${offsetY}px) rotate(${offsetY * 0.01}deg)`,
                            opacity: isDragging ? 1 - Math.abs(offsetY) / 240 : 1,
                            transition: isDragging ? "none" : "transform 0.25s ease, opacity 0.25s ease, box-shadow 0.4s ease",
                            boxShadow: `0 0 20px ${cardColors.posts.glow}, 0 4px 24px rgba(0,0,0,0.4)`,
                          }}
                        >
                          {/* Header bar */}
                          <div className="bg-neutral-900 px-3 py-2 flex items-start justify-between gap-2 shrink-0">
                            <span
                              className="text-white text-xs font-semibold leading-tight flex-1 min-w-0"
                              style={{
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                maskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                                WebkitMaskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                              }}
                            >
                              {post.title}
                            </span>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-neutral-400 leading-tight">In {post.jamName}</p>
                              <p className="text-[10px] text-neutral-500 leading-tight">({post.username})</p>
                            </div>
                          </div>

                          {/* Image area */}
                          <div
                            className="flex-1 bg-neutral-700 flex items-center justify-center overflow-hidden"
                            style={{
                              backgroundImage: post.image ? `url(${post.image})` : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            {!post.image && (
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#555" strokeWidth="1.5"/>
                                <circle cx="8.5" cy="8.5" r="1.5" fill="#555"/>
                                <path d="M21 15l-5-5L5 21" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            )}
                          </div>

                          {/* Description */}
                          <div className="bg-neutral-800 px-3 py-2 shrink-0">
                            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                              {post.description || "No description."}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>{/* end RIGHT COLUMN */}

        </section>
      </main>

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
        const stubTracking = isUpcoming(selectedJam.date);
        const accentColor  = stubTracking ? TRACKING_COLOR : ATTENDED_COLOR;
        const stubDate     = new Date(selectedJam.date).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        });

        return (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center">

            {/* Blurred backdrop — clicking it closes the stub */}
            <div
              onClick={() => setSelectedJam(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal card */}
            <div
              className="relative z-10 w-[600px] max-w-[94vw] rounded-3xl p-8 flex flex-col gap-6"
              style={{
                backgroundColor: "#141414",
                border: `1px solid ${accentColor}44`,
                boxShadow: `0 0 0 1px ${accentColor}22, 0 0 60px ${accentColor}33, 0 24px 80px rgba(0,0,0,0.8)`,
                animation: "stubSlideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent glow bar at the top of the card */}
              <div
                className="h-1 w-20 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, ${accentColor}44)`,
                  boxShadow: `0 0 12px ${accentColor}88`,
                }}
              />

              {/* Name + description */}
              <div className="flex flex-col gap-2">
                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: accentColor }}
                >
                  {selectedJam.name}
                </h2>
                <p className="text-sm text-white/60">{selectedJam.description}</p>
              </div>

              {/* Info rows */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Location</p>
                  <p className="text-white text-sm">{selectedJam.location}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Date</p>
                  <p className="text-white text-sm">{stubDate}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedJam.tags?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJam.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: accentColor + "22",
                          border: `1px solid ${accentColor}66`,
                          color: "#fff",
                          boxShadow: `0 0 8px ${accentColor}33`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: status badge + close hint */}
              <div className="flex items-center justify-between mt-2">
                <span
                  className="px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                  style={{
                    backgroundColor: accentColor,
                    color: stubTracking ? "#000" : "#fff",
                    boxShadow: `0 0 16px ${accentColor}66`,
                  }}
                >
                  {stubTracking ? "Tracking" : "Attended"}
                </span>

                {/* Subtle close hint — clicking anywhere outside also closes */}
                <p className="text-xs text-white/20">click outside to close</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Post Stub Modal ─────────────────────────────────────────────────── */}
      {selectedPost && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center">
          <div
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <div
            className="relative z-10 max-w-[94vw] rounded-3xl overflow-hidden flex flex-col"
            style={{
              width: "340px",
              backgroundColor: "#141414",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 60px rgba(220,46,115,0.2), 0 24px 80px rgba(0,0,0,0.8)",
              animation: "stubSlideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-neutral-900 px-5 py-4 flex items-start justify-between gap-3">
              <h2 className="text-white text-base font-bold leading-tight flex-1">
                {selectedPost.title}
              </h2>
              <div className="text-right shrink-0">
                <p className="text-xs text-neutral-400">In {selectedPost.jamName}</p>
                <p className="text-xs text-neutral-500">({selectedPost.username})</p>
              </div>
            </div>

            {/* Image */}
            <div
              className="w-full bg-neutral-700 flex items-center justify-center"
              style={{
                height: "280px",
                backgroundImage: selectedPost.image ? `url(${selectedPost.image})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!selectedPost.image && (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#555" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="#555"/>
                  <path d="M21 15l-5-5L5 21" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>

            {/* Description */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <p className="text-sm text-neutral-300 leading-relaxed">
                {selectedPost.description || "No description."}
              </p>
              <p className="text-xs text-white/20 text-right">click outside to close</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Post Creation Modal ─────────────────────────────────────────────── */}
      {postModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center">
          <div
            onClick={() => setPostModalOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div
            className="relative z-[3001] w-[420px] max-w-[94vw] rounded-2xl bg-neutral-900 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white">Create Post</h2>

            {/* Title */}
            <div>
              <p className="mb-1.5 text-sm text-neutral-400">Post Title</p>
              <input
                type="text"
                placeholder="What's this post about?"
                value={newPost.title}
                onChange={(e) => { if (e.target.value.length <= 20) setNewPost((p) => ({ ...p, title: e.target.value })); }}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none border border-transparent focus:border-[#DC2E73]/50"
              />
            </div>

            {/* Jam picker + username row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mb-1.5 text-sm text-neutral-400">Jam</p>
                {/* Backend: replace jams with the user's attended jams from API */}
                <select
                  value={newPost.jamName}
                  onChange={(e) => setNewPost((p) => ({ ...p, jamName: e.target.value }))}
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none border border-transparent focus:border-[#DC2E73]/50 cursor-pointer"
                  style={{ appearance: "none" }}
                >
                  <option value="" disabled>Pick a jam...</option>
                  {jams.map((j) => (
                    <option key={j.id} value={j.name}>{j.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-sm text-neutral-400">
                  Username
                  <span className="ml-1.5 text-[10px] text-neutral-600 font-normal">auto-filled</span>
                </p>
                {/* Backend: pre-fill from auth session — currentUser.username */}
                <div className="w-full rounded-lg bg-neutral-800/50 px-3 py-2.5 text-sm text-neutral-500 border border-neutral-700 border-dashed flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="3.5" r="2" stroke="#555" strokeWidth="1.2"/>
                    <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#555" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span>@username</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="mb-1.5 text-sm text-neutral-400">Description</p>
              <textarea
                placeholder="Short description..."
                value={newPost.description}
                maxLength={200}
                onChange={(e) => setNewPost((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none border border-transparent focus:border-[#DC2E73]/50 resize-none min-h-[80px]"
              />
              <p className="text-xs text-neutral-600 text-right mt-1">{newPost.description.length}/200</p>
            </div>

            {/* Image upload */}
            <div>
              <p className="mb-1.5 text-sm text-neutral-400">Image <span className="text-neutral-600">(optional)</span></p>
              <input
                type="file"
                accept="image/*"
                id="postImageUpload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  openCrop("portrait", file);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="postImageUpload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-neutral-300 transition-all duration-200 hover:border-transparent hover:bg-[#DC2E73] hover:text-white"
                style={newPost.image ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${newPost.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderColor: "transparent",
                } : {}}
              >
                <i className="fa-solid fa-image text-sm" />
                <span className="text-sm font-medium">{newPost.image ? "Change Image" : "Upload Image"}</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-1">
              <button
                onClick={() => {
                  setPostModalOpen(false);
                  setNewPost({ title: "", jamName: "", username: "", description: "", image: null });
                }}
                className="rounded-lg bg-neutral-700 px-4 py-2 text-sm hover:bg-neutral-600 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPost.title.trim()) { showToast("Post needs a title."); return; }
                  addPost(newPost);
                  setPostModalOpen(false);
                  setNewPost({ title: "", jamName: "", username: "", description: "", image: null });
                }}
                className="rounded-lg bg-[#DC2E73] px-4 py-2 text-sm hover:bg-pink-500 transition cursor-pointer text-white"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            onClick={() => setEditOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div
            className="relative z-[1000] flex w-[900px] max-w-[94vw] flex-col gap-6 rounded-3xl bg-neutral-900 p-6 text-white shadow-xl md:flex-row"
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
                <div className="space-y-4">
                  <div>
                    <input
                      value={name}
                      onChange={(e) => {
                        if (e.target.value.length <= 15) setName(e.target.value);
                      }}
                      className="w-full rounded-lg bg-white p-3 text-black"
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <input
                      value={location}
                      onChange={(e) => {
                        if (e.target.value.length <= 14) setLocation(e.target.value);
                      }}
                      className="w-full rounded-lg bg-white p-3 text-black"
                      placeholder="Location"
                    />
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
                  {/* Bio textarea */}
                  <div>
                    <p className="mb-1.5 text-sm text-neutral-400">Bio</p>
                    <textarea
                      value={about}
                      maxLength={300}
                      onChange={(e) => setAbout(e.target.value)}
                      className="min-h-[120px] w-full resize-none rounded-lg bg-neutral-800 p-3 text-sm"
                    />
                    <p className="mt-1 text-xs text-neutral-400">{about.length}/300 characters</p>
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
                <div className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    Add tags that describe your sound. Click a pill to remove it.
                  </p>
                  <div className="flex flex-wrap gap-2 min-h-[48px]">
                    {pills.map((pill, i) => (
                      <button
                        key={i}
                        onClick={() => setPills((prev) => prev.filter((_, idx) => idx !== i))}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-white transition group"
                        style={{
                          backgroundColor: pill.color + "22",
                          border: `1px solid ${pill.color}cc`,
                          boxShadow: `0 0 0 1px ${pill.color}44, 0 2px 10px ${pill.color}55`,
                        }}
                      >
                        {pill.text}
                        <span className="text-white/40 group-hover:text-white/80 text-xs leading-none">✕</span>
                      </button>
                    ))}
                    {pills.length === 0 && (
                      <p className="text-xs text-neutral-600 self-center">No pills yet, you can add some below.</p>
                    )}
                  </div>
                  {pills.length < 10 && (
                    <PillInput onAdd={(pill) => setPills((prev) => [...prev, pill])} />
                  )}
                  <p className="text-xs text-neutral-600">{pills.length}/10 pills</p>
                </div>
              )}

              {activeSection === "Card Colors" && (
                <div className="flex flex-col gap-1">

                  {/* Four compact rows */}
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
                    label="Posts"
                    value={cardColors.posts}
                    onChange={(c) => setCardColor("posts", c)}
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

              <button
                onClick={() => setEditOpen(false)}
                className="mt-6 rounded-full bg-pink-600 px-4 py-2 cursor-pointer"
              >
                Close
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
    </div>
  );
};

export default Profile;