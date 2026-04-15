import { useRef } from 'react'
import { MdUploadFile, MdClose, MdHeadphones } from 'react-icons/md'
import { hexToRgba } from '../../../utils/discovery'

const ACCENT = '#A78BFA'

// Simple static waveform — decorative placeholder
const WaveformPreview = () => {
  const bars = [4, 10, 16, 8, 20, 14, 24, 18, 12, 22, 16, 10, 20, 14, 8, 18, 22, 12, 16, 10]
  return (
    <div className="flex items-center gap-[2px] h-7 flex-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full flex-shrink-0"
          style={{
            width: 3,
            height: `${(h / 24) * 100}%`,
            minHeight: 3,
            background: `rgba(167,139,250,${0.3 + (h / 24) * 0.5})`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * ClipComposerBody — body for the "Post Clip" composer.
 *
 * Props:
 *   state    { caption: string, audioFile: File | null }
 *   onChange (patch: Partial<state>) => void
 *
 * Backend note:
 *   Upload audioFile to Supabase Storage bucket "post-media" at path
 *   "{author_id}/{post_id}/audio.{ext}" before inserting the post row.
 *   Store the returned public URL as posts.audio_url.
 *   Parse duration client-side via an <audio> element or send to the
 *   backend which can measure it with ffprobe: store as posts.audio_duration.
 */
export function ClipComposerBody({ state, onChange }) {
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('audio/')) return
    if (file.size > 50 * 1024 * 1024) {
      alert('Audio file must be under 50 MB.')
      return
    }
    onChange({ audioFile: file })
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      {/* Caption */}
      <textarea
        rows={3}
        value={state.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="What's this clip about? (optional)"
        className="w-full bg-transparent text-base sm:text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
        style={{ caretColor: ACCENT }}
        maxLength={500}
      />

      {/* Audio upload zone */}
      {state.audioFile ? (
        /* Preview card */
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: hexToRgba(ACCENT, 0.08),
            border: `1px solid ${hexToRgba(ACCENT, 0.2)}`,
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: hexToRgba(ACCENT, 0.2) }}
          >
            <MdHeadphones style={{ color: ACCENT, fontSize: 18 }} />
          </div>
          <WaveformPreview />
          <div className="flex flex-col items-end flex-shrink-0 gap-1">
            <span className="text-[10px] font-medium" style={{ color: ACCENT }}>
              {(state.audioFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            <button
              type="button"
              onClick={() => onChange({ audioFile: null })}
              aria-label="Remove audio"
              className="w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
              style={{ color: 'rgba(229,226,225,0.35)' }}
            >
              <MdClose className="text-sm" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload zone */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer transition-colors duration-150"
          style={{
            border: `1.5px dashed ${hexToRgba(ACCENT, 0.3)}`,
            background: hexToRgba(ACCENT, 0.04),
          }}
        >
          <MdUploadFile style={{ color: hexToRgba(ACCENT, 0.5), fontSize: 28 }} />
          <p className="text-[12px] font-medium" style={{ color: hexToRgba(ACCENT, 0.7) }}>
            Tap to upload audio
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
            MP3, WAV, AAC · max 50 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/*"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
