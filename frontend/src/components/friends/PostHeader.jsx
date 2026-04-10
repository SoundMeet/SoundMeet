import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdMoreHoriz, MdEditNote, MdDeleteOutline } from 'react-icons/md'
import { PostLocationTag } from './PostLocationTag'

const TYPE_BADGE = {
  jam:    { label: 'Jam',    color: '#DC2E73', bg: 'rgba(220,46,115,0.12)'  },
  clip:   { label: 'Clip',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  show:   { label: 'Show',   color: '#FCD34D', bg: 'rgba(252,211,77,0.12)'  },
  gear:   { label: 'Gear',   color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  review: { label: 'Review', color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
}

function formatTimestamp(isoString) {
  if (!isoString) return { label: 'just now', full: '' }
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return { label: 'just now', full: '' }

  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)

  try {
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const full = date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

    if (mins < 1)  return { label: 'just now',                   full }
    if (mins < 60) return { label: `${mins}m ago · ${timeStr}`,  full }

    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return { label: `${hrs}h ago · ${timeStr}`,   full }

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { label: `${dateStr} · ${timeStr}`, full }
  } catch {
    return { label: 'just now', full: '' }
  }
}

// Reusable musician instrument row — usable in post headers, comments, friend rows
export function InstrumentRow({ instruments, className = '' }) {
  if (!instruments?.length) return null
  const display = instruments.slice(0, 3)
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {display.map((inst, i) => (
        <span key={inst}>
          <span className="text-[10px]" style={{ color: 'rgba(167,139,250,0.72)' }}>{inst}</span>
          {i < display.length - 1 && (
            <span className="text-[10px] ml-0.5" style={{ color: 'rgba(229,226,225,0.2)' }}>·</span>
          )}
        </span>
      ))}
    </span>
  )
}

export function PostHeader({ author, createdAt, location, postType, isOwn, onEdit, onDelete }) {
  const badge = TYPE_BADGE[postType]
  const { label, full } = formatTimestamp(createdAt)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar — 40px */}
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 transition-transform duration-150 hover:scale-105 cursor-pointer"
            style={{ background: '#222' }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white transition-transform duration-150 hover:scale-105 cursor-pointer select-none"
            style={{ background: 'linear-gradient(135deg, rgba(220,46,115,0.5), rgba(251,64,64,0.3))' }}
          >
            {author.displayName?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Identity block */}
        <div className="min-w-0">
          {/* Name + type badge on same line */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[14px] font-semibold text-white leading-tight cursor-pointer hover:underline decoration-white/30 underline-offset-2 transition-all duration-150">
              {author.displayName}
            </p>
            {badge && (
              <span
                className="text-[10px] font-semibold px-1.5 py-[2px] rounded-full flex-shrink-0"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            )}
          </div>

          {/* Secondary row — instruments · timestamp · location */}
          <div className="flex items-center gap-1 flex-wrap mt-[3px]">
            {author.instruments?.length > 0 && (
              <>
                <InstrumentRow instruments={author.instruments} />
                <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.2)' }}>·</span>
              </>
            )}
            <span
              className="text-[11px] cursor-default leading-none"
              title={full}
              style={{ color: 'rgba(229,226,225,0.35)' }}
            >
              {label}
            </span>
            {location && (
              <>
                <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.2)' }}>·</span>
                <PostLocationTag location={location} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ··· menu */}
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-colors duration-150 hover:bg-white/[0.08]"
          style={{ color: menuOpen ? 'rgba(229,226,225,0.7)' : 'rgba(229,226,225,0.3)' }}
          aria-label="More options"
        >
          <MdMoreHoriz className="text-base" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: 'spring', stiffness: 480, damping: 28 }}
              className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-20"
              style={{
                background: 'rgba(26,26,26,0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              }}
            >
              {isOwn ? (
                <>
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition-colors hover:bg-white/[0.07]"
                    style={{ color: 'rgba(229,226,225,0.8)' }}
                  >
                    <MdEditNote className="text-base flex-shrink-0" style={{ color: 'rgba(229,226,225,0.4)' }} />
                    Edit post
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition-colors hover:bg-red-500/10"
                    style={{ color: 'rgba(251,100,100,0.85)' }}
                  >
                    <MdDeleteOutline className="text-base flex-shrink-0" />
                    Delete post
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition-colors hover:bg-white/[0.07]"
                  style={{ color: 'rgba(229,226,225,0.5)' }}
                >
                  Not interested
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
