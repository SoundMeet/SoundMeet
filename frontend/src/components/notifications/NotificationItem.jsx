import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, UserPlus, UserCheck, Heart, MessageCircle, Music, Bell, UserRound } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { useLiveTick } from '../../hooks/useLiveTick'

// ── Time formatting ───────────────────────────────────────────────────────────

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

// ── Sentence builders (plain text — for aria-label) ───────────────────────────

function buildSentence(type, fromUser, accepted, declined) {
  const name = fromUser?.displayName || 'Someone'
  switch (type) {
    case 'friend_request':
      if (accepted) return `You and ${name} are now friends`
      if (declined) return `Friend request from ${name} declined`
      return `${name} sent you a friend request`
    case 'friend_request_accepted':
      return `${name} accepted your friend request`
    case 'post_like':    return `${name} liked your post`
    case 'post_comment': return `${name} commented on your post`
    case 'jam_invite':   return `${name} invited you to a jam`
    case 'new_follower': return `${name} started following you`
    default:             return 'New notification'
  }
}

function buildGroupSentence(group) {
  const { type, _members, _count } = group
  if (_count === 1) {
    const m = _members[0]
    return buildSentence(type, m.fromUser, m.accepted, m.declined)
  }
  const firstName = _members[0]?.fromUser?.displayName || 'Someone'
  if (_count === 2) {
    const secondName = _members[1]?.fromUser?.displayName || 'Someone'
    if (type === 'post_like')    return `${firstName} and ${secondName} liked your post`
    if (type === 'new_follower') return `${firstName} and ${secondName} started following you`
  }
  const others = _count - 1
  const plural = others > 1 ? 'others' : 'other'
  if (type === 'post_like')    return `${firstName} and ${others} ${plural} liked your post`
  if (type === 'new_follower') return `${firstName} and ${others} ${plural} started following you`
  return group.message || 'New notification'
}

// ── JSX sentence renderers (bold usernames) ───────────────────────────────────

function N({ children }) {
  return (
    <span style={{ fontWeight: 600, color: 'rgba(229,226,225,0.92)' }}>
      {children}
    </span>
  )
}

function renderSentence(type, fromUser, accepted, declined) {
  const name = fromUser?.displayName || 'Someone'
  switch (type) {
    case 'friend_request':
      if (accepted) return <>You and <N>{name}</N> are now friends</>
      if (declined) return <>Friend request from <N>{name}</N> declined</>
      return <><N>{name}</N> sent you a friend request</>
    case 'friend_request_accepted': return <><N>{name}</N> accepted your friend request</>
    case 'post_like':               return <><N>{name}</N> liked your post</>
    case 'post_comment':            return <><N>{name}</N> commented on your post</>
    case 'jam_invite':              return <><N>{name}</N> invited you to a jam</>
    case 'new_follower':            return <><N>{name}</N> started following you</>
    default:                        return <>New notification</>
  }
}

function renderGroupSentence(group) {
  const { type, _members, _count } = group
  if (_count === 1) {
    const m = _members[0]
    return renderSentence(type, m.fromUser, m.accepted, m.declined)
  }
  const firstName = _members[0]?.fromUser?.displayName || 'Someone'
  if (_count === 2) {
    const secondName = _members[1]?.fromUser?.displayName || 'Someone'
    if (type === 'post_like')
      return <><N>{firstName}</N> and <N>{secondName}</N> liked your post</>
    if (type === 'new_follower')
      return <><N>{firstName}</N> and <N>{secondName}</N> started following you</>
  }
  const others = _count - 1
  const plural  = others > 1 ? 'others' : 'other'
  if (type === 'post_like')
    return <><N>{firstName}</N> and {others} {plural} liked your post</>
  if (type === 'new_follower')
    return <><N>{firstName}</N> and {others} {plural} started following you</>
  return <>{group.message || 'New notification'}</>
}

// ── Deep-link routing ─────────────────────────────────────────────────────────

function getDeepLink(type, referenceId, accepted, declined) {
  if (type === 'friend_request') {
    if (!accepted && !declined) return null
    return { path: '/chat' }
  }
  if (type === 'friend_request_accepted') return { path: '/chat' }
  if (type === 'post_like' || type === 'post_comment') return { path: '/feed' }
  if (type === 'jam_invite') return { path: '/', state: { openJamId: referenceId } }
  if (type === 'new_follower') return { path: '/meet' }
  return null
}

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META = {
  friend_request:          { label: 'Friend request' },
  friend_request_accepted: { label: 'Friend request' },
  post_like:               { label: 'Like'           },
  post_comment:            { label: 'Comment'        },
  jam_invite:              { label: 'Jam invite'     },
  new_follower:            { label: 'Follower'       },
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_BADGE_CFG = {
  friend_request:          { Icon: UserPlus,      color: '#DC2E73' },
  friend_request_accepted: { Icon: UserCheck,     color: '#3ecf5a' },
  post_like:               { Icon: Heart,          color: '#e05080' },
  post_comment:            { Icon: MessageCircle,  color: '#5b9cf6' },
  jam_invite:              { Icon: Music,           color: '#b06eff' },
  new_follower:            { Icon: UserRound,       color: '#38bdf8' },
}

function TypeBadge({ type }) {
  const cfg = TYPE_BADGE_CFG[type] ?? { Icon: Bell, color: 'rgba(229,226,225,0.45)' }
  const { Icon, color } = cfg
  return (
    <div
      className="absolute -bottom-[3px] -right-[3px] w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: '#111111',
        boxShadow: '0 0 0 1.5px #111111',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Icon size={9} style={{ color }} strokeWidth={2.5} />
    </div>
  )
}

// ── Avatar primitives ─────────────────────────────────────────────────────────

function SingleAvatar({ user }) {
  const [imgErr, setImgErr] = useState(false)
  const initial = (user?.displayName || '?')[0].toUpperCase()
  const showImg = !!user?.avatarUrl && !imgErr

  return (
    <div
      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #DC2E73, #c02460)' }}
    >
      {showImg ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName || ''}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-white select-none">
          {initial}
        </div>
      )}
    </div>
  )
}

function MiniAvatar({ user, textSizeClass }) {
  const [imgErr, setImgErr] = useState(false)
  const ini    = (user?.displayName || '?')[0].toUpperCase()
  const showImg = !!user?.avatarUrl && !imgErr

  if (showImg) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className="w-full h-full object-cover"
        onError={() => setImgErr(true)}
      />
    )
  }
  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold text-white select-none ${textSizeClass}`}
      style={{ background: 'linear-gradient(135deg, #DC2E73, #c02460)' }}
    >
      {ini}
    </div>
  )
}

function GroupAvatarStack({ members, count }) {
  const first    = members[0]
  const second   = members[1]
  const overflow = count > 2 ? count - 2 : 0

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      {/* Back slot */}
      <div
        className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full overflow-hidden"
        style={{ boxShadow: '0 0 0 2px #111111', zIndex: 1 }}
      >
        {overflow > 0 ? (
          <div
            className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            +{overflow}
          </div>
        ) : second ? (
          <MiniAvatar user={second.fromUser} textSizeClass="text-[8px]" />
        ) : null}
      </div>
      {/* Front slot */}
      <div
        className="absolute top-0 left-0 w-[28px] h-[28px] rounded-full overflow-hidden"
        style={{ boxShadow: '0 0 0 2px #111111', zIndex: 2 }}
      >
        {first && <MiniAvatar user={first.fromUser} textSizeClass="text-[10px]" />}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotificationItem({ notification, isLast, isNew }) {
  const { markRead, acceptRequest, declineRequest, loadingIds, dismissNotification } =
    useNotifications()
  const navigate = useNavigate()
  useLiveTick()

  const isGroup  = notification._group === true
  const { id, type, fromUser, isRead, createdAt, referenceId, accepted, declined } = notification

  const isLoading  = loadingIds.has(id)
  const isPending  = type === 'friend_request' && !accepted && !declined
  const isResolved = type === 'friend_request' && (accepted || declined)
  const isUnread   = !isRead && !isResolved

  // Plain text for accessibility
  const ariaLabel = isGroup
    ? buildGroupSentence(notification)
    : buildSentence(type, fromUser, accepted, declined)

  // JSX with bold names for display
  const sentenceJsx = isGroup
    ? renderGroupSentence(notification)
    : renderSentence(type, fromUser, accepted, declined)

  const typeLabel = TYPE_META[type]?.label ?? null
  const time      = timeAgo(createdAt)
  const deepLink  = getDeepLink(type, referenceId, accepted, declined)

  const handleClick = () => {
    if (!isRead) markRead(id)
    if (deepLink) navigate(deepLink.path, deepLink.state ? { state: deepLink.state } : undefined)
  }

  const handleAccept  = (e) => { e.stopPropagation(); acceptRequest(id, referenceId) }
  const handleDecline = (e) => { e.stopPropagation(); declineRequest(id, referenceId) }
  const handleDismiss = (e) => {
    e.stopPropagation()
    dismissNotification(isGroup ? notification._members.map((m) => m.id) : [id])
  }

  const showTypeBadge = !isGroup || notification._count === 1

  // Text color: dimmer for resolved, normal for read, brighter for unread
  const textColor = isResolved
    ? 'rgba(229,226,225,0.32)'
    : isUnread
    ? 'rgba(229,226,225,0.82)'
    : 'rgba(229,226,225,0.55)'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
      }}
      aria-label={ariaLabel}
      className="relative flex items-start gap-3 px-5 py-3 cursor-pointer group outline-none transition-colors duration-100 focus-visible:bg-white/[0.04]"
      style={{
        background: isUnread ? 'rgba(220,46,115,0.028)' : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.038)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isUnread ? 'rgba(220,46,115,0.028)' : 'transparent'
      }}
    >
      {/* Unread left accent bar */}
      {isUnread && (
        <div
          className="absolute left-0 top-[22%] bottom-[22%] w-[2px] rounded-r-full"
          style={{ background: '#DC2E73', opacity: 0.55 }}
          aria-hidden="true"
        />
      )}

      {/* New-notification pulse */}
      {isNew && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          style={{ background: 'rgba(220,46,115,0.08)' }}
        />
      )}

      {/* Avatar + type badge */}
      <div className="relative flex-shrink-0 mt-0.5">
        {isGroup && notification._count > 1 ? (
          <GroupAvatarStack members={notification._members} count={notification._count} />
        ) : (
          <SingleAvatar user={fromUser} />
        )}
        {showTypeBadge && <TypeBadge type={type} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5">
        {/* Primary sentence */}
        <p
          className="text-[13px] leading-[1.45]"
          style={{ color: textColor }}
        >
          {sentenceJsx}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-[5px] mt-[3px]">
          {typeLabel && (
            <>
              <span className="text-[11px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
                {typeLabel}
              </span>
              <span style={{ color: 'rgba(229,226,225,0.15)', fontSize: 10 }}>·</span>
            </>
          )}
          <span
            className="text-[11px] tabular-nums"
            style={{ color: isUnread ? 'rgba(220,46,115,0.55)' : 'rgba(229,226,225,0.25)' }}
          >
            {time}
          </span>
        </div>

        {/* Friend request — pending accept / decline */}
        {isPending && (
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #c02460)' }}
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 rounded-full border border-white/50 border-t-white animate-spin inline-block" />
                  Accepting…
                </>
              ) : (
                <>
                  <UserCheck size={11} strokeWidth={2.5} />
                  Accept
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
                  color: 'rgba(229,226,225,0.48)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                Decline
              </button>
            )}
          </div>
        )}

        {/* Friend request accepted */}
        {type === 'friend_request' && accepted && (
          <div className="flex items-center gap-1.5 mt-1.5">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-white/[0.07] focus:outline-none"
              style={{
                background: 'rgba(176,110,255,0.1)',
                color: '#b06eff',
                border: '1px solid rgba(176,110,255,0.18)',
              }}
            >
              <Music size={11} strokeWidth={2.5} />
              View Jam
            </button>
          </div>
        )}
      </div>

      {/* Unread dot (fades out on hover, replaced by dismiss X) */}
      {isUnread && (
        <div
          className="absolute right-4 top-4 w-[6px] h-[6px] rounded-full transition-opacity duration-150 group-hover:opacity-0 pointer-events-none"
          style={{ background: '#DC2E73' }}
          aria-label="Unread"
        />
      )}

      {/* Dismiss X (visible on hover) */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3.5 top-3.5 w-[18px] h-[18px] flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-white/[0.08] focus:outline-none focus-visible:opacity-100"
        aria-label="Dismiss notification"
      >
        <X size={10} style={{ color: 'rgba(229,226,225,0.4)' }} />
      </button>
    </div>
  )
}
