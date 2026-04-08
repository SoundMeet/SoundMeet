import { Music2 } from 'lucide-react'

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
      <span style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  )
}

const ChatHeader = ({ thread, users, onJamLinkClick }) => {
  const isJam = thread?.type === 'jam'

  let threadName = ''
  let subInfo = ''
  let participant = null

  if (isJam) {
    threadName = thread.name
    subInfo = `${thread.memberCount} members · ${thread.onlineCount} online`
  } else if (thread?.type === 'dm') {
    participant = (users || []).find((u) => u.id === thread.participantId)
    threadName = participant?.name || ''
    const s = participant?.status
    subInfo = s === 'online' ? 'Online' : s === 'away' ? 'Away' : 'Offline'
  }

  const statusDotColor =
    participant?.status === 'online' ? '#22C55E' :
    participant?.status === 'away'   ? '#F7C10D' :
    'rgba(229,226,225,0.25)'

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 flex-shrink-0"
      style={{
        backgroundColor: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        {!isJam && (
          <div className="flex-shrink-0">
            {participant?.avatar ? (
              <img
                src={participant.avatar}
                alt={participant?.name}
                className="rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <FallbackAvatar name={threadName} size={36} />
            )}
          </div>
        )}

        {isJam && (
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{ width: 36, height: 36, background: 'rgba(220,46,115,0.12)', color: '#DC2E73' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Name + status */}
        <div className="min-w-0">
          <div
            className="truncate"
            style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E5E2E1', lineHeight: '1.2' }}
          >
            {isJam
              ? <><span style={{ color: '#DC2E73' }}>#</span> {threadName}</>
              : threadName
            }
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {!isJam && (
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: statusDotColor,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: '0.68rem',
                color: 'rgba(229,226,225,0.42)',
                letterSpacing: '0.02em',
              }}
            >
              {subInfo}
            </span>
          </div>
        </div>
      </div>

      {isJam && (
        <button
          onClick={onJamLinkClick}
          className="flex items-center gap-1.5 text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #DC2E73, #FB4040)',
            borderRadius: '3rem',
            padding: '0.4rem 0.85rem',
            fontSize: '0.8rem',
          }}
        >
          <Music2 size={14} />
          <span className="hidden sm:inline">View Jam</span>
        </button>
      )}
    </div>
  )
}

export default ChatHeader
