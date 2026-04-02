import { useRef, useEffect } from "react";
import { hexToRgba } from "../../utils/discovery";

/**
 * ImageUploadField — optional cover image / poster uploader.
 *
 * Props:
 *   label     string                                   — section label
 *   hint      string                                   — subtext below label
 *   value     { file: File, previewUrl: string } | null
 *   onChange  (value | null) => void
 *   accent    string                                   — hex, used for hover ring
 *
 * Backend integration guide:
 *   When wiring to real storage (Supabase Storage):
 *   1. POST /api/uploads/presigned-url/ → { uploadUrl, publicUrl }
 *   2. PUT uploadUrl with raw file bytes + Content-Type header
 *   3. Include cover_image_url: publicUrl in the main create payload
 *   Alternatively: accept multipart/form-data on the create endpoint.
 *   Field name on backend model: cover_image_url (nullable URLField / text).
 *   Max recommended size: 10 MB. Accepted types: image/jpeg, image/png, image/webp.
 */
const ImageUploadField = ({ label, hint, value, onChange, accent = "#DC2E73" }) => {
  const inputRef  = useRef(null);
  const prevUrl   = useRef(null);

  // Revoke stale object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    };
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      // Simple inline guard — replace with a toast when the toast system is wired
      alert("Image must be under 10 MB.");
      return;
    }
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    const previewUrl = URL.createObjectURL(file);
    prevUrl.current = previewUrl;
    onChange({ file, previewUrl });
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected after removal
    e.target.value = "";
  };

  const handleRemove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    prevUrl.current = null;
    onChange(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: "rgba(229,226,225,0.4)" }}
        >
          {label}
        </p>
      )}

      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !value && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !value && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative w-full overflow-hidden transition-all duration-200"
        style={{
          height:       value ? 180 : 88,
          borderRadius: "0.875rem",
          border:       value
            ? `1px solid ${hexToRgba(accent, 0.3)}`
            : `1.5px dashed rgba(255,255,255,0.12)`,
          background:   value
            ? "transparent"
            : "rgba(255,255,255,0.03)",
          cursor:       value ? "default" : "pointer",
        }}
      >
        {value ? (
          <>
            <img
              src={value.previewUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              aria-label="Remove image"
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-opacity duration-150 hover:opacity-100"
              style={{
                background: "rgba(0,0,0,0.65)",
                color: "rgba(229,226,225,0.9)",
                opacity: 0.85,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Swap button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              aria-label="Change image"
              className="absolute bottom-2 right-2 h-6 px-2.5 flex items-center rounded-full text-[10px] font-semibold transition-opacity duration-150 hover:opacity-100"
              style={{
                background: "rgba(0,0,0,0.65)",
                color: "rgba(229,226,225,0.85)",
                opacity: 0.8,
              }}
            >
              Change
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 pointer-events-none select-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(229,226,225,0.2)" }}>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            <span className="text-[11px]" style={{ color: "rgba(229,226,225,0.28)" }}>
              Tap to upload or drag an image
            </span>
          </div>
        )}
      </div>

      {hint && !value && (
        <p className="text-[11px] ml-0.5" style={{ color: "rgba(229,226,225,0.2)" }}>
          {hint}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};

export default ImageUploadField;
