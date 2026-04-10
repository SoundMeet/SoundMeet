import { useRef, useState } from 'react'
import { MdClose, MdAddPhotoAlternate } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { hexToRgba } from '../../../utils/discovery'

const ACCENT    = '#34D399'
const MAX_PHOTOS = 4

// ─── Upload icon SVG ──────────────────────────────────────────────────────────

const UploadCloudIcon = ({ size = 26, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
)

// ─── Individual photo cell with hover remove ──────────────────────────────────

function PhotoCell({ photo, onRemove }) {
  return (
    <div className="relative overflow-hidden group w-full h-full">
      <img
        src={photo.previewUrl}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        draggable={false}
      />
      {/* Gradient + remove button — appear on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 50%)' }}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute top-2 right-2 w-[22px] h-[22px] flex items-center justify-center rounded-full
                   opacity-0 group-hover:opacity-100 transition-all duration-150
                   hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.72)', color: '#fff', backdropFilter: 'blur(4px)' }}
      >
        <MdClose style={{ fontSize: 11 }} />
      </button>
    </div>
  )
}

// ─── Photo grid — layout adapts to photo count ───────────────────────────────

function PhotoGrid({ photos, onRemove }) {
  const count = photos.length

  // Single: wide hero
  if (count === 1) {
    return (
      <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9', background: '#111' }}>
        <PhotoCell photo={photos[0]} onRemove={() => onRemove(0)} />
      </div>
    )
  }

  // Duo: two equal columns
  if (count === 2) {
    return (
      <div
        className="overflow-hidden rounded-2xl grid grid-cols-2"
        style={{ height: 220, gap: 2, background: '#0d0d0d' }}
      >
        {photos.map((p, i) => (
          <PhotoCell key={i} photo={p} onRemove={() => onRemove(i)} />
        ))}
      </div>
    )
  }

  // Trio: main left (2/3) + two stacked right (1/3)
  if (count === 3) {
    return (
      <div
        className="overflow-hidden rounded-2xl flex"
        style={{ height: 250, gap: 2, background: '#0d0d0d' }}
      >
        <div className="flex-[3] relative overflow-hidden">
          <PhotoCell photo={photos[0]} onRemove={() => onRemove(0)} />
        </div>
        <div className="flex-[2] flex flex-col" style={{ gap: 2 }}>
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 relative overflow-hidden">
              <PhotoCell photo={photos[i]} onRemove={() => onRemove(i)} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Quad: 2x2
  return (
    <div
      className="overflow-hidden rounded-2xl grid grid-cols-2"
      style={{ height: 250, gap: 2, background: '#0d0d0d' }}
    >
      {photos.map((p, i) => (
        <PhotoCell key={i} photo={p} onRemove={() => onRemove(i)} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhotoComposerBody({ state, onChange }) {
  const inputRef  = useRef(null)
  const [dragOver, setDragOver] = useState(false)

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
    URL.revokeObjectURL(state.photos[index].previewUrl)
    onChange({ photos: state.photos.filter((_, i) => i !== index) })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addPhotos(e.dataTransfer.files)
  }
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e) => {
    // Only clear if pointer actually left this element
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
  }

  const hasPhotos = state.photos.length > 0
  const canAddMore = state.photos.length < MAX_PHOTOS
  const slotsLeft = MAX_PHOTOS - state.photos.length

  return (
    <div className="flex flex-col gap-4">

      {/* ── Media section ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        {hasPhotos ? (

          /* ── Selected: photo grid + add-more ────────────────────────── */
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-2"
          >
            <PhotoGrid photos={state.photos} onRemove={removePhoto} />

            {/* Add more — compact secondary strip */}
            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                           transition-all duration-150 active:scale-[0.99]"
                style={{
                  border: `1px dashed ${dragOver
                    ? hexToRgba(ACCENT, 0.55)
                    : 'rgba(255,255,255,0.1)'}`,
                  background: dragOver
                    ? hexToRgba(ACCENT, 0.05)
                    : 'rgba(255,255,255,0.02)',
                  color: dragOver ? ACCENT : 'rgba(229,226,225,0.35)',
                  transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                }}
              >
                <MdAddPhotoAlternate style={{ fontSize: 14 }} />
                <span className="text-[12px] font-medium">
                  Add {slotsLeft} more {slotsLeft === 1 ? 'photo' : 'photos'}
                </span>
              </button>
            )}
          </motion.div>

        ) : (

          /* ── Empty: compact upload zone ─────────────────────────────── */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-4 py-10 rounded-2xl cursor-pointer
                       select-none focus-visible:outline-none"
            style={{
              border: `1.5px ${dragOver ? 'solid' : 'dashed'} ${
                dragOver ? hexToRgba(ACCENT, 0.5) : 'rgba(255,255,255,0.09)'
              }`,
              background: dragOver
                ? hexToRgba(ACCENT, 0.04)
                : 'rgba(255,255,255,0.015)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-150"
              style={{
                background: dragOver
                  ? hexToRgba(ACCENT, 0.18)
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <UploadCloudIcon
                size={22}
                color={dragOver ? ACCENT : 'rgba(229,226,225,0.4)'}
              />
            </div>

            {/* Text hierarchy */}
            <div className="text-center" style={{ lineHeight: 1 }}>
              <p
                className="text-[13px] font-semibold mb-1.5"
                style={{ color: dragOver ? ACCENT : 'rgba(229,226,225,0.78)' }}
              >
                {dragOver ? 'Drop photos here' : 'Add photos'}
              </p>
              <p className="text-[12px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
                Drag and drop, or{' '}
                <span
                  style={{
                    color: hexToRgba(ACCENT, 0.75),
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  browse files
                </span>
              </p>
              <p className="text-[11px] mt-2" style={{ color: 'rgba(229,226,225,0.18)' }}>
                JPG, PNG, WebP, GIF &nbsp;·&nbsp; up to {MAX_PHOTOS} photos
              </p>
            </div>
          </motion.div>

        )}
      </AnimatePresence>

      {/* ── Caption ───────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: hasPhotos ? '1px solid rgba(255,255,255,0.06)' : 'none',
          paddingTop: hasPhotos ? 4 : 0,
        }}
      >
        <textarea
          rows={2}
          value={state.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder={hasPhotos ? 'Add a caption…' : 'Caption will appear here…'}
          className="w-full bg-transparent text-[13px] leading-relaxed text-white outline-none
                     resize-none placeholder:text-white/[0.18]"
          style={{ caretColor: ACCENT }}
          maxLength={500}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addPhotos(e.target.files)
          e.target.value = ''
        }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
