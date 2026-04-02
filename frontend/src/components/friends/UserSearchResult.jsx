import { MdMessage } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'

function RelationshipButton({ status, userId }) {
  const { updateRelationship } = useFriends()

  const configs = {
    none: {
      primary: { label: 'Add Friend', action: () => updateRelationship(userId, 'request_sent') },
      secondary: { label: 'Follow', action: () => updateRelationship(userId, 'following') },
    },
    following: {
      primary: { label: 'Add Friend', action: () => updateRelationship(userId, 'request_sent') },
      secondary: { label: 'Following ✓', action: null, disabled: true },
    },
    follower: {
      primary: { label: 'Add Friend', action: () => updateRelationship(userId, 'request_sent') },
      secondary: { label: 'Follow Back', action: () => updateRelationship(userId, 'following') },
    },
    request_sent: {
      primary: { label: 'Request Sent', action: null, disabled: true },
      secondary: null,
    },
    request_received: {
      primary: { label: 'Accept Request', action: () => updateRelationship(userId, 'friends') },
      secondary: { label: 'Decline', action: () => updateRelationship(userId, 'none') },
    },
    friends: {
      primary: { label: 'Friends ✓', action: null, disabled: true },
      secondary: null,
    },
  }

  const cfg = configs[status] || configs.none

  return (
    <div className="flex items-center gap-2">
      {cfg.secondary && (
        <button
          onClick={cfg.secondary.action}
          disabled={cfg.secondary.disabled}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(229,226,225,0.7)',
          }}
        >
          {cfg.secondary.label}
        </button>
      )}
      <button
        onClick={cfg.primary.action}
        disabled={cfg.primary.disabled}
        className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: cfg.primary.disabled
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg, #DC2E73, #FB4040)',
          color: cfg.primary.disabled ? 'rgba(229,226,225,0.5)' : '#fff',
        }}
      >
        {cfg.primary.label}
      </button>
    </div>
  )
}

export function UserSearchResult({ user }) {
  const {
    id, displayName, username, avatarUrl, instruments,
    genres, distanceMiles, mutualFriendsCount, isOnline, relationshipStatus,
  } = user

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-white/[0.06] cursor-pointer"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-11 h-11 rounded-full object-cover transition-transform duration-150 group-hover:scale-105"
          style={{ background: '#222' }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-black" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white">{displayName}</span>
          <span className="text-[11px]" style={{ color: 'rgba(229,226,225,0.4)' }}>@{username}</span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {distanceMiles != null && (
            <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
              {distanceMiles} mi away
            </span>
          )}
          {mutualFriendsCount > 0 && (
            <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
              · {mutualFriendsCount} mutual
            </span>
          )}
        </div>

        {/* Instrument pills */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {instruments.slice(0, 3).map((inst) => (
            <span
              key={inst}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(220,46,115,0.1)',
                color: 'rgba(220,46,115,0.8)',
                border: '1px solid rgba(220,46,115,0.2)',
              }}
            >
              {inst}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <RelationshipButton status={relationshipStatus} userId={id} />
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.6)' }}
            aria-label="Message"
          >
            <MdMessage className="text-base" />
          </button>
        </div>
      </div>
    </div>
  )
}
