import { useState } from 'react'
import { MdPlayArrow, MdPause } from 'react-icons/md'
import { PostJamRef } from './PostJamRef'

// Static waveform bars — purely decorative
function Waveform({ isPlaying }) {
  const bars = [4, 8, 14, 10, 18, 12, 20, 16, 10, 24, 18, 14, 22, 16, 10, 20, 14, 8, 16, 12, 20, 18, 10, 16, 12, 8, 14, 10, 6, 12, 16, 20, 14, 18, 10, 24, 20, 14, 12, 8]

  return (
    <div className="flex items-center gap-[2px] h-8 flex-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full flex-shrink-0 transition-colors duration-300"
          style={{
            width: 3,
            height: `${(h / 24) * 100}%`,
            minHeight: 3,
            background: isPlaying
              ? `rgba(220,46,115,${0.4 + (h / 24) * 0.6})`
              : `rgba(229,226,225,${0.1 + (h / 24) * 0.2})`,
          }}
        />
      ))}
    </div>
  )
}

export function PostAudioBody({ content, media, jamRef }) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="mt-3">
      {content && (
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(229,226,225,0.85)' }}>
          {content}
        </p>
      )}

      {/* Audio player */}
      <div
        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-all duration-150 hover:brightness-110 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying
            ? <MdPause className="text-lg" />
            : <MdPlayArrow className="text-lg" />
          }
        </button>

        <Waveform isPlaying={isPlaying} />

        <span
          className="text-[11px] font-medium flex-shrink-0 tabular-nums"
          style={{ color: 'rgba(229,226,225,0.4)' }}
        >
          {media?.duration ?? '0:00'}
        </span>
      </div>

      {jamRef && <PostJamRef jamRef={jamRef} />}
    </div>
  )
}
