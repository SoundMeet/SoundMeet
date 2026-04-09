import PresenceDot from './PresenceDot'

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

const ChatListItem = ({ item, isActive, onClick, users }) => {
  const base = [
    'flex items-center gap-3 mx-1 px-3 py-2.5 cursor-pointer',
    'rounded-xl transition-all duration-150',
    'border-l-2',
    isActive
      ? 'bg-white/[0.07] border-[#DC2E73]'
      : 'border-transparent hover:bg-white/[0.04]',
  ].join(' ')

  if (item.type === 'dm') {
    const participant = (users || []).find((u) => u.id === item.participantId)
    if (!participant) return null

    const statusLabel =
      participant.status === 'online' ? 'Online' :
      participant.status === 'away'   ? 'Away'   : 'Offline'

    const statusColor =
      participant.status === 'online' ? 'rgba(34,197,94,0.75)' :
      participant.status === 'away'   ? 'rgba(247,193,13,0.75)' :
      'rgba(229,226,225,0.3)'

    return (
      <div className={base} onClick={onClick}>
        {/* Avatar with unread badge */}
        <div className="relative flex-shrink-0">
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
          {item.unread > 0 && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2E73] text-white flex items-center justify-center"
              style={{ fontSize: '9px', fontWeight: 700 }}
            >
              {item.unread}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate leading-tight"
            style={{ fontSize: '0.85rem', fontWeight: 500, color: '#E5E2E1' }}
          >
            {participant.name}
          </div>
          <div
            className="truncate leading-tight mt-0.5"
            style={{ fontSize: '0.7rem', color: statusColor }}
          >
            {statusLabel}
          </div>
        </div>

        <PresenceDot status={participant.status} />
      </div>
    )
  }

  // Jam variant
  const memberText = item.memberCount > 0 ? `${item.memberCount} members` : null

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
          style={{ fontSize: '0.85rem', fontWeight: 500, color: '#E5E2E1' }}
        >
          {item.name}
        </div>
        {(memberText || item.active) && (
          <div
            className="truncate leading-tight mt-0.5"
            style={{
              fontSize: '0.7rem',
              color: item.active ? 'rgba(220,46,115,0.8)' : 'rgba(229,226,225,0.35)',
            }}
          >
            {item.active ? 'Active' : memberText}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatListItem
