import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, UserPlus, UserCheck, Heart, MessageCircle, Music, Bell, UserRound } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { useLiveTick } from '../../hooks/useLiveTick'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getDisplayMessage(type, message, fromUser, accepted, declined) {
  const name = fromUser?.displayName || 'Someone'
  if (type === 'friend_request') {
    if (accepted) return `You and ${name} are now friends`
    if (declined) return `Friend request from ${name} declined`
    return `${name} sent you a friend request`
  }
  if (type === 'friend_request_accepted') {
    return `${name} accepted your friend request`
  }
  return message || 'New notification'
}

function getGroupMessage(g) {
  const { type, _members, _count } = g
  if (_count === 1) {
    return getDisplayMessage(type, g.message, g.fromUser, g.accepted, g.declined)
  }
  const first = _members[0]?.fromUser?.displayName || 'Someone'
  const second = _members[1]?.fromUser?.displayName || 'Someone'
  const rest = _count - 2
  const suffix = rest > 0 ? ` and ${rest} other${rest > 1 ? 's' : ''}` : ''
  const names = rest > 0 ? `${first}, ${second}${suffix}` : `${first} and ${second}`
  if (type === 'post_like') return `${names} liked your post`
  if (type === 'new_follower') return `${names} started following you`
  return g.message
}

/**
 * Returns the destination for clicking this notification, or null if no
 * navigation should happen (e.g. pending friend requests with inline actions).
 */
function getDeepLink(type, referenceId, accepted, declined) {
  if (type === 'friend_request') {
    // Pending request → no navigation; the Accept/Decline buttons handle it
    if (!accepted && !declined) return null
    // Accepted/declined → chat with new friend
    return { path: '/chat' }
  }
  if (type === 'friend_request_accepted') return { path: '/chat' }
  if (type === 'post_like' || type === 'post_comment') return { path: '/feed' }
  if (type === 'jam_invite') return { path: '/', state: { openJamId: referenceId } }
  if (type === 'new_follower') return { path: '/meet' }
  return null
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AvatarFallback({ displayName, size = 10 }) {
  const initial = (displayName || '?')[0].toUpperCase()
  const dim = size === 10 ? 'w-10 h-10 text-[13px]' : 'w-7 h-7 text-[10px]'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white select-none flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #DC2E73 0%, #c02460 100%)' }}
    >
      {initial}
    </div>
  )
}

function Avatar({ user, size = 10 }) {
  const dim = size === 10 ? 'w-10 h-10' : 'w-7 h-7'
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
        style={{ background: '#1a1a1a' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const sib = e.currentTarget.nextElementSibling
          if (sib) sib.style.display = 'flex'
        }}
      />
    )
  }
  return <AvatarFallback displayName={user?.displayName} size={size} />
}

function GroupAvatarStack({ members }) {
  const shown = members.slice(0, 3)
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      {shown.map((m, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 28, height: 28,
            top: i === 0 ? 0 : i * 7,
            left: i === 0 ? 0 : i * 5,
            zIndex: shown.length - i,
            outline: '2px solid rgba(13,13,13,0.98)',
          }}
        >
          <Avatar user={m.fromUser} size={7} />
        </div>
      ))}
    </div>
  )
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_BADGE = {
  friend_request: { Icon: UserPlus, bg: '#1a1a2e', color: '#DC2E73' },
  friend_request_accepted: { Icon: UserCheck, bg: '#0f2010', color: '#3ecf5a' },
  post_like: { Icon: Heart, bg: '#1f1014', color: '#e05080' },
  post_comment: { Icon: MessageCircle, bg: '#101820', color: '#5b9cf6' },
  jam_invite: { Icon: Music, bg: '#1a1020', color: '#b06eff' },
  new_follower: { Icon: UserRound, bg: '#111a1f', color: '#38bdf8' },
}

function TypeBadge({ type }) {
  const cfg = TYPE_BADGE[type] ?? { Icon: Bell, bg: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }
  const { Icon, bg, color } = cfg
  return (
    <div
      className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: bg, border: '1.5px solid rgba(13,13,13,0.98)' }}
    >
      <Icon size={9} style={{ color }} strokeWidth={2.5} />
    </div>
  )
}

function CountBadge({ count }) {
  if (count <= 1) return null
  return (
    <div
      className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
      style={{ background: '#DC2E73', border: '1.5px solid rgba(13,13,13,0.98)' }}
    >
      {count > 99 ? '99+' : `+${count - 1}`}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationItem({ notification, isLast, isNew }) {
  const { markRead, acceptRequest, declineRequest, loadingIds, dismissNotification } =
    useNotifications()
  const navigate = useNavigate()

  // Trigger re-render every 60s so "5m ago" stays accurate
  useLiveTick()

  const isGroup = notification._group === true
  const { id, type, fromUser, message, isRead, createdAt, referenceId, accepted, declined } =
    notification

  const isLoading = loadingIds.has(id)
  const isResolved = type === 'friend_request' && (accepted || declined)

  const displayMessage = isGroup
    ? getGroupMessage(notification)
    : getDisplayMessage(type, message, fromUser, accepted, declined)

  const deepLink = getDeepLink(type, referenceId, accepted, declined)

  const handleClick = () => {
    if (!isRead) markRead(id)
    if (deepLink) {
      navigate(deepLink.path, deepLink.state ? { state: deepLink.state } : undefined)
    }
  }

  const handleAccept = (e) => {
    e.stopPropagation()
    acceptRequest(id, referenceId)
  }

  const handleDecline = (e) => {
    e.stopPropagation()
    declineRequest(id, referenceId)
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    const ids = isGroup ? notification._members.map((m) => m.id) : [id]
    dismissNotification(ids)
  }

  return (
    <div
      onClick={handleClick}
      className="relative flex items-start gap-3 px-4 py-3.5 cursor-pointer group transition-colors duration-150 overflow-hidden"
      style={{
        background: !isRead && !isResolved ? 'rgba(220,46,115,0.03)' : 'transparent',
        borderLeft: !isRead && !isResolved ? '2px solid #DC2E73' : '2px solid transparent',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          !isRead && !isResolved ? 'rgba(220,46,115,0.03)' : 'transparent'
      }}
    >
      {/* New-notification highlight pulse (fades out over 2.5s) */}
      {isNew && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          style={{ background: 'rgba(220,46,115,0.10)' }}
        />
      )}

      {/* Avatar + badge */}
      <div className="relative flex-shrink-0 mt-0.5">
        {isGroup && notification._count > 1 ? (
          <>
            <GroupAvatarStack members={notification._members} />
            <CountBadge count={notification._count} />
          </>
        ) : (
          <>
            <Avatar user={fromUser} size={10} />
            <TypeBadge type={type} />
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5">
        <p
          className="text-[13px] leading-snug"
          style={{
            color: isResolved
              ? 'rgba(229,226,225,0.4)'
              : isRead
              ? 'rgba(229,226,225,0.65)'
              : 'rgba(229,226,225,0.92)',
          }}
        >
          {displayMessage}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.28)' }}>
            {timeAgo(createdAt)}
          </p>
          {/* Deep link hint — only for navigable notifications */}
          {deepLink && !isResolved && (
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'rgba(220,46,115,0.6)' }}>
              ↗
            </span>
          )}
        </div>

        {/* Friend request actions — pending only */}
        {type === 'friend_request' && !accepted && !declined && (
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #c02460)' }}
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 rounded-full border border-white/50 border-t-white animate-spin inline-block" />
                  <span>Accepting…</span>
                </>
              ) : (
                <>
                  <UserCheck size={12} strokeWidth={2.5} />
                  <span>Accept</span>
                </>
              )}
            </button>
            {!isLoading && (
              <button
                type="button"
                onClick={handleDecline}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-white/[0.07] disabled:opacity-50 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(229,226,225,0.55)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Decline
              </button>
            )}
          </div>
        )}

        {/* Accepted confirmation */}
        {type === 'friend_request' && accepted && (
          <div className="flex items-center gap-1.5 mt-2">
            <UserCheck size={11} style={{ color: '#3ecf5a' }} strokeWidth={2.5} />
            <span className="text-[11px] font-medium" style={{ color: '#3ecf5a' }}>Friends</span>
          </div>
        )}

        {/* Jam invite action */}
        {type === 'jam_invite' && (
          <div className="mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                markRead(id)
                navigate('/', { state: { openJamId: referenceId } })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-white/[0.07] focus:outline-none"
              style={{
                background: 'rgba(176,110,255,0.1)',
                color: '#b06eff',
                border: '1px solid rgba(176,110,255,0.2)',
              }}
            >
              <Music size={11} strokeWidth={2.5} />
              View Jam
            </button>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!isRead && !isResolved && (
        <div className="absolute right-4 top-4">
          <div
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: '#DC2E73', boxShadow: '0 0 5px rgba(220,46,115,0.55)' }}
          />
        </div>
      )}

      {/* Dismiss × — appears on hover */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3.5 top-3.5 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none hover:bg-white/[0.08]"
        aria-label="Dismiss notification"
      >
        <X size={12} style={{ color: 'rgba(229,226,225,0.4)' }} />
      </button>
    </div>
  )
}
