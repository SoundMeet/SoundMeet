import { useNotifications } from '../../context/NotificationsContext'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationItem({ notification, onClose }) {
  const { markRead, acceptRequest, declineRequest } = useNotifications()
  const { id, type, fromUser, message, isRead, createdAt } = notification

  const handleClick = () => {
    if (!isRead) markRead(id)
  }

  const handleAccept = (e) => {
    e.stopPropagation()
    acceptRequest(fromUser.id)
    markRead(id)
  }

  const handleDecline = (e) => {
    e.stopPropagation()
    declineRequest(fromUser.id)
    markRead(id)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-white/5"
      style={{
        borderLeft: isRead ? '3px solid transparent' : '3px solid #DC2E73',
        background: isRead ? 'transparent' : 'rgba(220,46,115,0.04)',
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={fromUser.avatarUrl}
          alt={fromUser.displayName}
          className="w-9 h-9 rounded-full object-cover"
          style={{ background: '#222' }}
        />
        {/* Type icon badge */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {type === 'friend_request' && '👥'}
          {type === 'post_like' && '♥'}
          {type === 'post_comment' && '💬'}
          {type === 'jam_invite' && '🎸'}
          {type === 'new_follower' && '➕'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs leading-snug"
          style={{ color: isRead ? 'rgba(229,226,225,0.6)' : 'rgba(229,226,225,0.9)' }}
        >
          {message}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(229,226,225,0.3)' }}>
          {timeAgo(createdAt)}
        </p>

        {/* Friend request actions */}
        {type === 'friend_request' && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAccept}
              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors hover:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(229,226,225,0.6)',
              }}
            >
              Decline
            </button>
          </div>
        )}

        {/* Jam invite view button */}
        {type === 'jam_invite' && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); markRead(id) }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors hover:bg-white/10"
              style={{
                background: 'rgba(220,46,115,0.12)',
                color: '#DC2E73',
                border: '1px solid rgba(220,46,115,0.25)',
              }}
            >
              View Jam
            </button>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!isRead && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#DC2E73]" />
        </div>
      )}
    </div>
  )
}
