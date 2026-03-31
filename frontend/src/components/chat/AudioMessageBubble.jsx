import { useState, useEffect, useRef } from 'react'

const parseDuration = (dur) => {
  const parts = (dur || '0:00').split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

const formatTime = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const AudioMessageBubble = ({ message, isOutgoing, showSenderInfo, sender }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadPercent, setPlayheadPercent] = useState(0)
  const [displayTime, setDisplayTime] = useState('0:00')
  const intervalRef = useRef(null)
  const elapsedRef = useRef(0)
  const totalSeconds = parseDuration(message.duration)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1
        const pct = Math.min((elapsedRef.current / totalSeconds) * 100, 100)
        setPlayheadPercent(pct)
        setDisplayTime(formatTime(elapsedRef.current))

        if (elapsedRef.current >= totalSeconds) {
          clearInterval(intervalRef.current)
          setIsPlaying(false)
          elapsedRef.current = 0
          setPlayheadPercent(0)
          setDisplayTime('0:00')
        }
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, totalSeconds])

  const handleWaveformClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setPlayheadPercent(pct)
    elapsedRef.current = Math.round((pct / 100) * totalSeconds)
    setDisplayTime(formatTime(elapsedRef.current))
  }

  const containerClass = isOutgoing
    ? 'rounded-2xl p-4 transition-colors duration-200 cursor-pointer'
    : 'rounded-2xl p-4 bg-[#141414]/80 hover:bg-[#0D0D0D]/90 transition-colors duration-200 cursor-pointer'

  const containerStyle = isOutgoing
    ? {
        background: 'linear-gradient(135deg, #DC2E73, #FB4040)',
        maxWidth: 420,
      }
    : {
        maxWidth: 420,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }

  const bars = message.waveformBars || Array.from({ length: 40 }, () => 0.5)
  const playedCount = Math.floor((playheadPercent / 100) * bars.length)

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'items-end gap-2'}`}>
      {/* Incoming avatar */}
      {!isOutgoing && (
        <div style={{ width: 36, flexShrink: 0 }}>
          {showSenderInfo && (
            <img
              src={sender?.avatar}
              alt={sender?.name}
              className="rounded-full object-cover"
              style={{ width: 36, height: 36 }}
            />
          )}
        </div>
      )}

      <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
        {showSenderInfo && !isOutgoing && sender && (
          <div
            className="mb-1"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(229,226,225,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {sender.name}
          </div>
        )}

        <div className={containerClass} style={containerStyle}>
          {/* Main row: play button + waveform + duration */}
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'white' }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="4" height="14" rx="1" fill="#141414" />
                  <rect x="10" y="1" width="4" height="14" rx="1" fill="#141414" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <polygon points="3,1 15,8 3,15" fill="#141414" />
                </svg>
              )}
            </button>

            {/* Waveform scrub zone */}
            <div
              className="flex items-center flex-1 cursor-pointer"
              style={{ height: 40 }}
              onClick={handleWaveformClick}
            >
              {bars.map((bar, i) => {
                const played = i < playedCount
                const barHeight = Math.max(6, Math.min(40, bar * 40))
                return (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: barHeight,
                      borderRadius: 9999,
                      marginLeft: 1,
                      marginRight: 1,
                      flexShrink: 0,
                      background: played
                        ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                        : 'rgba(229,226,225,0.3)',
                    }}
                  />
                )
              })}
            </div>

            {/* Duration */}
            <div
              className="flex-shrink-0 tabular-nums"
              style={{
                fontSize: '0.75rem',
                color: 'rgba(229,226,225,0.7)',
                minWidth: 32,
              }}
            >
              {isPlaying ? displayTime : message.duration}
            </div>
          </div>

          {/* Filename */}
          {message.filename && (
            <div
              className="mt-2 font-medium truncate"
              style={{ fontSize: '0.75rem', color: '#E5E2E1' }}
            >
              {message.filename}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioMessageBubble
