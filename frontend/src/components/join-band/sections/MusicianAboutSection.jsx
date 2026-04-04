import { useRef } from "react";

// ─── Field ────────────────────────────────────────────────────────────────────

const Field = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        {label}
        {required && (
          <span style={{ color: "#8B5CF6" }} aria-hidden>*</span>
        )}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs" style={{ color: "#FB4040" }}>{error}</p>
    )}
    {!error && hint && (
      <p className="text-xs" style={{ color: "rgba(229,226,225,0.28)" }}>{hint}</p>
    )}
  </div>
);

// ─── ProfileNameRow ───────────────────────────────────────────────────────────

/**
 * Read-only display of the user's SoundMeet profile name.
 * Clearly communicates this comes from their account, not from this form.
 */
const ProfileNameRow = ({ name }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Profile Name
      </label>
      <span
        className="text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(139,92,246,0.1)",
          color:      "rgba(139,92,246,0.7)",
          border:     "1px solid rgba(139,92,246,0.18)",
        }}
      >
        From your profile
      </span>
    </div>
    <div
      className="px-3 py-2.5 rounded-xl text-sm select-none"
      style={{
        background: "rgba(255,255,255,0.03)",
        border:     "1px solid rgba(255,255,255,0.06)",
        color:      "rgba(229,226,225,0.55)",
        cursor:     "default",
      }}
    >
      {name || "—"}
    </div>
  </div>
);

// ─── ProfilePhotoField ────────────────────────────────────────────────────────

/**
 * Profile-aware photo field.
 *
 * Three states:
 *   1. listingPhoto set → show listing-specific override with swap / remove buttons
 *   2. profilePhotoUrl set, no override → show profile photo with "Use different" option
 *   3. Neither set → show standard upload zone
 */
const ProfilePhotoField = ({ profilePhotoUrl, listingPhoto, onChange, accent = "#8B5CF6" }) => {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10 MB.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  // ── State 1: listing-specific photo override ────────────────────────────────
  if (listingPhoto) {
    return (
      <div className="space-y-1.5">
        <label
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          Listing Photo
        </label>
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 140, borderRadius: "0.875rem", border: `1px solid rgba(139,92,246,0.3)` }}
        >
          <img
            src={listingPhoto.previewUrl}
            alt="Listing photo"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute bottom-2 left-2 h-6 px-2.5 flex items-center rounded-full text-[10px] font-semibold"
            style={{ background: "rgba(0,0,0,0.65)", color: "rgba(229,226,225,0.85)" }}
          >
            Use profile photo
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 h-6 px-2.5 flex items-center rounded-full text-[10px] font-semibold"
            style={{ background: "rgba(0,0,0,0.65)", color: "rgba(229,226,225,0.85)" }}
          >
            Change
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden
          tabIndex={-1}
        />
      </div>
    );
  }

  // ── State 2: profile photo as default ──────────────────────────────────────
  if (profilePhotoUrl) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "rgba(229,226,225,0.4)" }}
          >
            Photo
          </label>
          <span
            className="text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(139,92,246,0.1)",
              color:      "rgba(139,92,246,0.7)",
              border:     "1px solid rgba(139,92,246,0.18)",
            }}
          >
            From your profile
          </span>
        </div>
        <div
          className="relative overflow-hidden"
          style={{ height: 100, borderRadius: "0.875rem", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <img
            src={profilePhotoUrl}
            alt="Profile photo"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 h-6 px-2.5 flex items-center rounded-full text-[10px] font-semibold"
            style={{ background: "rgba(0,0,0,0.65)", color: "rgba(229,226,225,0.85)" }}
          >
            Use different photo
          </button>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(229,226,225,0.22)" }}>
          Optional — upload a different photo for this listing.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden
          tabIndex={-1}
        />
      </div>
    );
  }

  // ── State 3: no profile photo — standard upload zone ──────────────────────
  return (
    <div className="space-y-1.5">
      <label
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "rgba(229,226,225,0.4)" }}
      >
        Photo
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200"
        style={{
          height:       88,
          borderRadius: "0.875rem",
          border:       "1.5px dashed rgba(255,255,255,0.12)",
          background:   "rgba(255,255,255,0.03)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "rgba(229,226,225,0.2)" }}
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="text-[11px] pointer-events-none select-none" style={{ color: "rgba(229,226,225,0.28)" }}>
          Tap to upload or drag an image
        </span>
      </div>
      <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.2)" }}>
        Optional — a photo that represents you as a musician for this listing.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden
        tabIndex={-1}
      />
    </div>
  );
};

// ─── MusicianAboutSection ─────────────────────────────────────────────────────

/**
 * MusicianAboutSection — listing identity, prefilled from the user's SoundMeet profile.
 *
 * Step 1 of the Join a Band listing flow.
 *
 * The `profile` prop represents the already-existing SoundMeet account data.
 * Fields here are listing-level customizations on top of that profile.
 *
 * Props:
 *   form     { artistName, photo, city, headline, bio }
 *   errors   { city? }
 *   profile  { name, city, photoUrl }
 *   onChange (field, value) => void
 *   accent   string
 */
const MusicianAboutSection = ({
  form,
  errors  = {},
  profile = {},
  onChange,
  accent  = "#8B5CF6",
}) => (
  <div className="space-y-4">

    {/* ── Intro ─────────────────────────────────────────────────────────────── */}
    <div
      className="pb-4 mb-1"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="text-[13px] font-semibold text-white mb-1.5">
        Your Listing
      </p>
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "rgba(229,226,225,0.42)" }}
      >
        Create a Join a Band listing so bands and collaborators can discover you
        through SoundMeet. We'll prefill this from your existing profile — customize
        it for the kind of project you're looking for.
      </p>
    </div>

    {/* ── Profile Name (read-only) ─────────────────────────────────────────── */}
    <ProfileNameRow name={profile.name} />

    {/* ── Artist / Display Name override ──────────────────────────────────── */}
    <Field
      label="Artist Name"
      hint="Optional — use a stage name or alias for this listing. Leave blank to use your profile name."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. The Reverb Ghost or Alex M."
        maxLength={80}
        value={form.artistName}
        onChange={(e) => onChange("artistName", e.target.value)}
      />
    </Field>

    {/* ── City / Area ─────────────────────────────────────────────────────── */}
    <Field
      label="City / Area"
      required
      error={errors.city}
      hint="Prefilled from your profile — used for local matching."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Miami, FL"
        value={form.city}
        onChange={(e) => onChange("city", e.target.value)}
      />
    </Field>

    {/* ── Headline ─────────────────────────────────────────────────────────── */}
    <Field
      label="Headline"
      hint="A quick line about who you are as a musician."
    >
      <input
        type="text"
        className="jam-input"
        placeholder="e.g. Drummer & producer looking for an original rock project"
        maxLength={120}
        value={form.headline}
        onChange={(e) => onChange("headline", e.target.value)}
      />
    </Field>

    {/* ── Photo ────────────────────────────────────────────────────────────── */}
    <ProfilePhotoField
      profilePhotoUrl={profile.photoUrl}
      listingPhoto={form.photo}
      onChange={(v) => onChange("photo", v)}
      accent={accent}
    />

    {/* ── About You ────────────────────────────────────────────────────────── */}
    <Field
      label="About You"
      hint="Briefly describe what you play, your style, and the kind of project you're looking for."
    >
      <textarea
        rows={3}
        className="jam-input resize-none"
        style={{ borderRadius: "0.75rem" }}
        placeholder="e.g. Been playing guitar for 10 years — indie, shoegaze, some math rock. Looking for a creative band that writes originals and plays shows."
        maxLength={500}
        value={form.bio}
        onChange={(e) => onChange("bio", e.target.value)}
      />
    </Field>

  </div>
);

export default MusicianAboutSection;
