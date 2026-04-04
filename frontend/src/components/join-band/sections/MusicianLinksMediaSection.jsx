// ─── Field ────────────────────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
      </label>
    )}
    {children}
    {hint && (
      <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.22)" }}>
        {hint}
      </p>
    )}
  </div>
);

// ─── LinkInput ────────────────────────────────────────────────────────────────

const LinkInput = ({ placeholder, value, onChange }) => (
  <input
    type="url"
    className="jam-input"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

// ─── MusicianLinksMediaSection ────────────────────────────────────────────────

/**
 * MusicianLinksMediaSection — links and media for quick discovery.
 *
 * The featured link is visually emphasised as the primary proof-of-work field.
 * All other fields are optional and grouped to avoid empty-space awkwardness.
 *
 * Props:
 *   form     { featuredLink, audioLink, videoLink, instagram, youtube, spotifyOrWebsite }
 *   onChange (field, value) => void
 */
const MusicianLinksMediaSection = ({ form, onChange }) => (
  <div className="space-y-4">

    {/* Featured link — emphasised */}
    <div
      className="space-y-2 p-4 rounded-xl"
      style={{
        background: "rgba(139,92,246,0.06)",
        border:     "1px solid rgba(139,92,246,0.14)",
      }}
    >
      <label
        className="block text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(139,92,246,0.8)" }}
      >
        Featured Link
      </label>
      <LinkInput
        placeholder="Your best audio or video — SoundCloud, YouTube, Bandcamp…"
        value={form.featuredLink}
        onChange={(v) => onChange("featuredLink", v)}
      />
      <p className="text-[11px]" style={{ color: "rgba(229,226,225,0.28)" }}>
        This is the first thing people will check. Make it count.
      </p>
    </div>

    {/* Audio & Video */}
    <div
      className="pt-3 space-y-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Field label="Audio" hint="SoundCloud, Bandcamp, or any audio link">
        <LinkInput
          placeholder="soundcloud.com/you"
          value={form.audioLink}
          onChange={(v) => onChange("audioLink", v)}
        />
      </Field>

      <Field label="Video" hint="YouTube, Vimeo, or a live performance clip">
        <LinkInput
          placeholder="youtube.com/watch?v=..."
          value={form.videoLink}
          onChange={(v) => onChange("videoLink", v)}
        />
      </Field>
    </div>

    {/* Social & web */}
    <div
      className="pt-3 space-y-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Field label="Instagram">
        <LinkInput
          placeholder="instagram.com/you"
          value={form.instagram}
          onChange={(v) => onChange("instagram", v)}
        />
      </Field>

      <Field label="YouTube / TikTok">
        <LinkInput
          placeholder="youtube.com/you  or  tiktok.com/@you"
          value={form.youtube}
          onChange={(v) => onChange("youtube", v)}
        />
      </Field>

      <Field label="Spotify / Website">
        <LinkInput
          placeholder="open.spotify.com/artist/…  or  yoursite.com"
          value={form.spotifyOrWebsite}
          onChange={(v) => onChange("spotifyOrWebsite", v)}
        />
      </Field>
    </div>

  </div>
);

export default MusicianLinksMediaSection;
