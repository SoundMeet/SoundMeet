import { useRef } from 'react'
import { MdAddPhotoAlternate, MdClose } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'

const ACCENT    = '#34D399'
const MAX_PHOTOS = 4

/**
 * PhotoComposerBody — body for the "Share Photo" composer.
 *
 * Props:
 *   state    { caption: string, photos: { file: File, previewUrl: string }[] }
 *   onChange (patch) => void
 *
 * Backend note:
 *   Upload each photo file to Supabase Storage bucket "post-media" at path
 *   "{author_id}/{post_id}/photo_{n}.{ext}" and collect the public URLs.
 *   Store as posts.photo_urls (JSONB string array).
 *   Revoke previewUrls after upload completes to avoid memory leaks.
 */
export function PhotoComposerBody({ state, onChange }) {
  const inputRef = useRef(null)

  const addPhotos = (files) => {
    const remaining = MAX_PHOTOS - state.photos.length
    if (remaining <= 0) return
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining)
    const newPhotos = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    onChange({ photos: [...state.photos, ...newPhotos] })
  }

  const removePhoto = (index) => {
    const updated = state.photos.filter((_, i) => i !== index)
    // Revoke the removed object URL
    URL.revokeObjectURL(state.photos[index].previewUrl)
    onChange({ photos: updated })
  }

  const handleInputChange = (e) => {
    if (e.target.files?.length) addPhotos(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addPhotos(e.dataTransfer.files)
  }

  const hasPhotos = state.photos.length > 0
  const canAddMore = state.photos.length < MAX_PHOTOS

  return (
    <div className="space-y-4">
      {/* Photo grid */}
      {hasPhotos ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: state.photos.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}
        >
          {state.photos.map((photo, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl"
              style={{ aspectRatio: state.photos.length === 1 ? '16/9' : '1/1' }}
            >
              <img
                src={photo.previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-100"
                style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', opacity: 0.85 }}
              >
                <MdClose className="text-xs" />
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl transition-colors duration-150"
              style={{
                aspectRatio: '1/1',
                border: `1.5px dashed ${hexToRgba(ACCENT, 0.3)}`,
                background: hexToRgba(ACCENT, 0.04),
                color: hexToRgba(ACCENT, 0.6),
              }}
            >
              <MdAddPhotoAlternate style={{ fontSize: 22 }} />
              <span className="text-[10px] font-medium">
                {MAX_PHOTOS - state.photos.length} more
              </span>
            </button>
          )}
        </div>
      ) : (
        /* Empty upload zone */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl cursor-pointer transition-colors duration-150"
          style={{
            border: `1.5px dashed ${hexToRgba(ACCENT, 0.3)}`,
            background: hexToRgba(ACCENT, 0.04),
          }}
        >
          <MdAddPhotoAlternate style={{ color: hexToRgba(ACCENT, 0.5), fontSize: 32 }} />
          <p className="text-[12px] font-medium" style={{ color: hexToRgba(ACCENT, 0.7) }}>
            Tap to add photos
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
            Up to {MAX_PHOTOS} photos · JPG, PNG, WebP
          </p>
        </div>
      )}

      {/* Caption */}
      <textarea
        rows={2}
        value={state.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Say something about these photos… (optional)"
        className="w-full bg-transparent text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={500}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
