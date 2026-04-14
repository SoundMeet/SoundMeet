// ── Link Platform Config ────────────────────────────────────────────────────────
// Single source of truth for all profile link platforms.
// To add a new platform: add one entry here. Everything else picks it up.
//
// Recommended future additions (need corresponding backend URLField):
//   apple_music, website, custom
// ────────────────────────────────────────────────────────────────────────────────

// ── Icons ────────────────────────────────────────────────────────────────────────
// All 24×24, stroke-based. Color is always inherited via currentColor.

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="17.2" cy="6.8" r="1.4" fill="currentColor"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M9 17a4 4 0 1 0 4-4V4h3a5 5 0 0 0 5 5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.8"/>
    <polygon points="10,9 17,12 10,15" fill="currentColor"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 14.5c2.3-1.2 5.7-1.2 8 0"   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M7 11.5c3-1.5 7-1.5 10 0"        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8.5 8.5c2.2-1 4.8-1 7 0"        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const SoundCloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 16a3 3 0 0 1 0-6h.4a5.5 5.5 0 0 1 10.7-1.2A3.5 3.5 0 0 1 19.5 16"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
    <path d="M5 19v-4M8 19v-6M11 19V9M14 19v-5M17 19v-4M20 19v-3"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

const BandcampIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 17L9 7h12L15 17H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────────

function ensureHttps(val) {
  if (!val) return "";
  const v = val.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function stripHandle(url, domain) {
  // e.g. instagram.com/handle → "@handle"
  const re = new RegExp(`${domain.replace(".", "\\.")}\\/([^/?#\\s]+)`, "i");
  const m  = url.match(re);
  return m ? m[1] : null;
}

// ── Platform definitions ──────────────────────────────────────────────────────────
// key          → matches the Django model field name (and the FormData key)
// label        → human-readable name shown in the UI
// Icon         → React component, renders 16×16 SVG
// placeholder  → input placeholder text
// acceptsHandle→ true = user can type @handle; we convert it to a full URL
// normalize()  → cleans raw user input into a proper https:// URL (or "")
// displayHandle() → given a stored URL, returns a short readable label

export const LINK_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: InstagramIcon,
    placeholder: "@handle or instagram.com/you",
    acceptsHandle: true,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      const handle =
        v.startsWith("@")               ? v.slice(1)
        : stripHandle(v, "instagram.com") ?? null;
      if (handle) return `https://instagram.com/${handle}`;
      return ensureHttps(v);
    },
    displayHandle(url) {
      const h = stripHandle(url, "instagram.com");
      return h ? `@${h}` : url.replace(/^https?:\/\//, "");
    },
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: TikTokIcon,
    placeholder: "@handle or tiktok.com/@you",
    acceptsHandle: true,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      // tiktok.com/@handle or @handle
      const m = v.match(/tiktok\.com\/@?([^/?#\s]+)/i);
      const handle = m ? m[1] : v.startsWith("@") ? v.slice(1) : null;
      if (handle) return `https://tiktok.com/@${handle}`;
      return ensureHttps(v);
    },
    displayHandle(url) {
      const m = url.match(/tiktok\.com\/@?([^/?#\s]+)/i);
      return m ? `@${m[1]}` : url.replace(/^https?:\/\//, "");
    },
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: YouTubeIcon,
    placeholder: "youtube.com/@channel or full URL",
    acceptsHandle: false,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      if (v.startsWith("@")) return `https://youtube.com/${v}`;
      return ensureHttps(v);
    },
    displayHandle(url) {
      const m = url.match(/youtube\.com\/(@[^/?#\s]+|c\/[^/?#\s]+|channel\/[^/?#\s]+)/i);
      if (m) return m[1];
      return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    },
  },
  {
    key: "spotify",
    label: "Spotify",
    Icon: SpotifyIcon,
    placeholder: "open.spotify.com/artist/…",
    acceptsHandle: false,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      return ensureHttps(v);
    },
    displayHandle(url) {
      const m = url.match(/spotify\.com\/artist\/([^/?#\s]+)/i);
      if (m) return `artist/${m[1].slice(0, 12)}…`;
      const artist = url.match(/spotify\.com\/([^/?#\s]+)/i);
      return artist ? `spotify.com/${artist[1]}` : "Spotify";
    },
  },
  {
    key: "soundcloud",
    label: "SoundCloud",
    Icon: SoundCloudIcon,
    placeholder: "soundcloud.com/yourname",
    acceptsHandle: false,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      if (v.includes("soundcloud.com") || v.startsWith("http")) return ensureHttps(v);
      return `https://soundcloud.com/${v}`;
    },
    displayHandle(url) {
      const m = url.match(/soundcloud\.com\/([^/?#\s]+)/i);
      return m ? m[1] : "SoundCloud";
    },
  },
  {
    key: "bandcamp",
    label: "Bandcamp",
    Icon: BandcampIcon,
    placeholder: "yourname.bandcamp.com or full URL",
    acceptsHandle: false,
    normalize(raw) {
      const v = raw.trim();
      if (!v) return "";
      return ensureHttps(v);
    },
    displayHandle(url) {
      const m = url.match(/([^./]+)\.bandcamp\.com/i);
      if (m) return `${m[1]}.bandcamp.com`;
      return url.replace(/^https?:\/\//, "").split("/")[0];
    },
  },
];

// ── External link icon ────────────────────────────────────────────────────────────
export const ExternalLinkIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
