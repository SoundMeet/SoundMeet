import PresenceDot from './PresenceDot'

const labelSm = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgba(229,226,225,0.7)',
}

const ChatListItem = ({ item, isActive, onClick, users }) => {
  const base = [
    'flex items-center gap-3 mx-2 px-3 py-3 cursor-pointer',
    'rounded-2xl transition-colors duration-150',
    'border-l-2',
    isActive
      ? 'bg-[#393939] border-[#DC2E73]'
      : 'border-transparent hover:bg-[#393939]',
  ].join(' ')

  if (item.type === 'dm') {
    const participant = (users || []).find(u => u.id === item.participantId)
    if (!participant) return null

    const statusLabel =
      participant.status === 'online' ? 'Online' :
      participant.status === 'away'   ? 'Away'   : 'Offline'

    return (
      <div className={base} onClick={onClick}>
        {/* Avatar with unread badge */}
        <div className="relative flex-shrink-0">
          <img
            src={participant.avatar}
            alt={participant.name}
            className="rounded-full object-cover ring-2 ring-[#2A2A2A]"
            style={{ width: 40, height: 40 }}
          />
          {item.unread > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2E73] text-white text-[10px] font-bold flex items-center justify-center">
              {item.unread}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#E5E2E1] truncate">
            {participant.name}
          </div>
          <div style={labelSm} className="truncate">
            ({statusLabel})
          </div>
        </div>

        <PresenceDot status={participant.status} />
      </div>
    )
  }

  // Jam variant
  return (
    <div className={base} onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#DC2E73]">#</span>
          <span className="text-sm font-medium text-[#E5E2E1] truncate">
            {item.name}
          </span>
        </div>
        {item.active && (
          <div style={{ ...labelSm, color: '#DC2E73' }} className="font-medium">
            (Active)
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatListItem
