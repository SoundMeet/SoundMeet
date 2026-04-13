import { useRef, useState } from 'react'
import { extractEventLink } from '../../utils/eventLinkParser'

const LONG_PRESS_MS = 500

const AVATAR_PALETTE = ['#C2185B', '#7B1FA2', '#1565C0', '#00695C', '#E65100', '#4527A0']

function FallbackAvatar({ name, size }) {
  const initials = (name || '?')
    .split(' ').slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase()
  const bg = AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontSize: size * 0.37, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  )
}

// ─── Format timestamp for sidebar (WhatsApp-style) ───────────────────────────
function formatListTime(isoTimestamp) {
  if (!isoTimestamp) return null
  const d = new Date(isoTimestamp)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }
  return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })
}

// ─── Build a short preview string for a last-message object ─────────────────
// Returns { text, isInvite } so callers can style invite previews distinctly.
function getMessagePreview(lastMessage) {
  if (!lastMessage) return null
  const { type, content } = lastMessage
  if (type === 'image')   return { text: '📷 Photo',      isInvite: false }
  if (type === 'sticker') return { text: 'Sticker',        isInvite: false }
  if (type === 'link')    return { text: '🔗 Link',        isInvite: false }
  if (type === 'invite')  return { text: 'Jam invite',  isInvite: true  }
  // System events — don't expose raw sentinel strings
  if (content === '__system:left_chat__') return { text: 'Left the chat', isInvite: false }
  // Detect SoundMeet event links embedded in text messages
  if (content && extractEventLink(content)) {
    return { text: 'Jam invite', isInvite: true }
  }
  return content ? { text: content, isInvite: false } : null
}

const ChatListItem = ({ item, isActive, onClick, onHide, users, currentUserId }) => {
  const base = [
    'flex items-center gap-3 mx-1 px-3 py-2.5 cursor-pointer',
    'rounded-xl transition-all duration-150',
    isActive
      ? 'bg-white/[0.09]'
      : 'hover:bg-white/[0.05]',
  ].join(' ')

  // ─── Long-press state (DM only) ────────────────────────────────────────────
  const pressTimer  = useRef(null)
  const didLongPress = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const startPress = () => {
    didLongPress.current = false
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    clearTimeout(pressTimer.current)
  }

  const handleClick = (e) => {
    if (didLongPress.current) { e.preventDefault(); return }
    onClick?.()
  }

  // ─── DM variant ────────────────────────────────────────────────────────────
  if (item.type === 'dm') {
    const participant = (users || []).find((u) => u.id === item.participantId)
    if (!participant) return null

    const previewResult = getMessagePreview(item.lastMessage)
    const timeStr       = formatListTime(item.lastMessage?.isoTimestamp)
    const isOwn         = item.lastMessage && String(item.lastMessage.senderId) === String(currentUserId)
    const previewLabel  = previewResult
      ? (isOwn ? `You: ${previewResult.text}` : previewResult.text)
      : null
    const previewIsInvite = !isOwn && previewResult?.isInvite

    return (
      <div className="relative">
        <div
          className={base}
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true) }}
        >
          {/* Avatar */}
          <div className="flex-shrink-0" style={{ width: 36, height: 36 }}>
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <FallbackAvatar name={participant.name} size={36} />
            )}
          </div>

          {/* Name + preview (or status fallback) */}
          <div className="flex-1 min-w-0">
            <div
              className="truncate leading-tight"
              style={{
                fontSize:   '0.84rem',
                fontWeight: item.unread > 0 ? 700 : 600,
                color:      isActive ? '#E5E2E1' : item.unread > 0 ? '#E5E2E1' : 'rgba(229,226,225,0.88)',
              }}
            >
              {participant.name}
            </div>
            {previewLabel && (
              <div
                className="truncate leading-tight mt-0.5"
                style={{
                  fontSize: '0.69rem',
                  color: previewIsInvite
                    ? 'rgba(220,46,115,0.75)'
                    : item.unread > 0
                      ? 'rgba(229,226,225,0.75)'
                      : 'rgba(229,226,225,0.4)',
                }}
              >
                {previewLabel}
              </div>
            )}
          </div>

          {/* Right column: time + unread badge */}
          {(timeStr || item.unread > 0) && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
              {timeStr && (
                <span style={{ fontSize: '0.6rem', color: 'rgba(229,226,225,0.3)', whiteSpace: 'nowrap' }}>
                  {timeStr}
                </span>
              )}
              {item.unread > 0 && (
                <div
                  className="rounded-full bg-[#DC2E73] text-white flex items-center justify-center"
                  style={{
                    minWidth:   '1rem',
                    height:     '1rem',
                    padding:    '0 4px',
                    fontSize:   '9px',
                    fontWeight: 700,
                  }}
                >
                  {item.unread > 99 ? '99+' : item.unread}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Long-press context menu */}
        {menuOpen && (
          <>
            {/* Dismiss overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div
              className="absolute left-2 right-2 z-50 rounded-xl overflow-hidden"
              style={{
                top:       '100%',
                marginTop: 4,
                background: 'rgba(28,28,30,0.98)',
                border:     '1px solid rgba(255,255,255,0.1)',
                boxShadow:  '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-white/[0.06]"
                style={{ fontSize: '0.84rem', color: 'rgba(251,64,64,0.85)' }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onHide?.() }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                Delete Conversation
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ─── Jam variant ───────────────────────────────────────────────────────────
  const previewResult  = getMessagePreview(item.lastMessage)
  const timeStr        = formatListTime(item.lastMessage?.isoTimestamp)
  const isOwn          = item.lastMessage && String(item.lastMessage.senderId) === String(currentUserId)

  // For group chats show sender prefix so it's clear who said it
  let previewLabel = null
  if (previewResult) {
    previewLabel = isOwn ? `You: ${previewResult.text}` : previewResult.text
  }
  const previewIsInvite = !isOwn && previewResult?.isInvite

  const secondaryText = previewLabel ?? (item.memberCount > 0 ? `${item.memberCount} members` : null)
  const secondaryColor = previewIsInvite
    ? 'rgba(220,46,115,0.75)'
    : previewLabel
      ? 'rgba(229,226,225,0.4)'
      : item.active
        ? 'rgba(220,46,115,0.75)'
        : 'rgba(229,226,225,0.32)'

  return (
    <div className={base} onClick={onClick}>
      {/* Jam avatar placeholder */}
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-xl"
        style={{
          width: 36, height: 36,
          background: 'rgba(220,46,115,0.12)',
          color: '#DC2E73',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="truncate leading-tight"
          style={{
            fontSize:   '0.84rem',
            fontWeight: item.unread > 0 ? 700 : 600,
            color:      isActive ? '#E5E2E1' : item.unread > 0 ? '#E5E2E1' : 'rgba(229,226,225,0.88)',
          }}
        >
          {item.name}
        </div>
        {secondaryText && (
          <div
            className="truncate leading-tight mt-0.5"
            style={{
              fontSize: '0.69rem',
              color: previewIsInvite
                ? 'rgba(220,46,115,0.75)'
                : item.unread > 0 && previewLabel
                  ? 'rgba(229,226,225,0.75)'
                  : secondaryColor,
            }}
          >
            {secondaryText}
          </div>
        )}
      </div>

      {/* Right column: time + unread badge */}
      {(timeStr || item.unread > 0) && (
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
          {timeStr && (
            <span style={{ fontSize: '0.6rem', color: 'rgba(229,226,225,0.3)', whiteSpace: 'nowrap' }}>
              {timeStr}
            </span>
          )}
          {item.unread > 0 && (
            <div
              className="rounded-full bg-[#DC2E73] text-white flex items-center justify-center"
              style={{
                minWidth:   '1rem',
                height:     '1rem',
                padding:    '0 4px',
                fontSize:   '9px',
                fontWeight: 700,
              }}
            >
              {item.unread > 99 ? '99+' : item.unread}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatListItem
