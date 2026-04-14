import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFriends } from '../../context/FriendsContext'
import { ProfilesRUS } from '../../services/ProfilesRUS'

// ─── Icons ────────────────────────────────────────────────────────────────────

function MessageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CheckIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Fallback avatar ──────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['#C2185B', '#7B1FA2', '#1565C0', '#00695C', '#E65100', '#4527A0']

function FallbackAvatar({ name, size }) {
  const initials = (name || '?')
    .split(' ').slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase()
  const bg = AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ color: '#fff', fontSize: size * 0.37, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  )
}

function Avatar({ src, name, size = 36 }) {
  const [broken, setBroken] = React.useState(false)
  if (!src || broken) return <FallbackAvatar name={name} size={size} />
  return (
    <img src={src} alt={name} width={size} height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, background: '#1c1c1e' }}
      onError={() => setBroken(true)}
    />
  )
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────

function Tag({ label, highlighted }) {
  return (
    <span
      className="text-[10px] font-medium px-1.5 rounded whitespace-nowrap"
      style={{
        height: 17, display: 'inline-flex', alignItems: 'center',
        ...(highlighted
          ? { background: 'rgba(220,46,115,0.14)', color: 'rgba(220,46,115,0.85)' }
          : { background: 'rgba(255,255,255,0.07)', color: 'rgba(229,226,225,0.42)' }
        ),
      }}
    >
      {label}
    </span>
  )
}

// ─── Relationship controls ────────────────────────────────────────────────────

function RelationshipButton({ status, userId }) {
  const { sendFriendRequest, updateRelationship } = useFriends()

  if (status === 'friends') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md"
        style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(52,211,153,0.8)' }}
      >
        <CheckIcon size={10} />
        Friends
      </span>
    )
  }

  if (status === 'request_sent') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.38)' }}
      >
        <CheckIcon size={10} />
        Sent
      </span>
    )
  }

  if (status === 'request_received') {
    return (
      <div className="flex items-center gap-1">
        <ActionBtn
          label="Accept"
          accent
          onClick={() => updateRelationship(userId, 'friends')}
        />
        <ActionBtn
          label="Decline"
          onClick={() => updateRelationship(userId, 'none')}
        />
      </div>
    )
  }

  return (
    <ActionBtn
      label="Add Friend"
      accent
      onClick={() => sendFriendRequest(userId)}
    />
  )
}

function ActionBtn({ label, accent = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
      style={accent
        ? { background: 'rgba(220,46,115,0.15)', color: 'rgba(220,46,115,0.9)' }
        : { background: 'rgba(255,255,255,0.07)', color: 'rgba(229,226,225,0.55)' }
      }
    >
      {label}
    </button>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────

export function UserSearchResult({ user, activeQuery }) {
  const { id, profileId, displayName, username, avatarUrl, instruments, genres, vibes, relationshipStatus } = user
  const navigate = useNavigate()

  const lq = (activeQuery || '').toLowerCase().trim()
  const isMatch = (str) => lq && str.toLowerCase().includes(lq)

  const tags = [
    ...instruments.slice(0, 2).map((t) => ({ label: t, key: `i-${t}` })),
    ...genres.slice(0, 2).map((t) => ({ label: t, key: `g-${t}` })),
    ...vibes.slice(0, 1).map((t) => ({ label: t, key: `v-${t}` })),
  ].slice(0, 4)

  return (
    <div
      className="flex items-center gap-3 transition-colors duration-100"
      style={{ padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar + name — clickable to open profile */}
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={() => profileId && ProfilesRUS(navigate, profileId)}
        style={{ cursor: profileId ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0 }}
      >
        <div className="flex-shrink-0">
          <Avatar src={avatarUrl} name={displayName} size={36} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-medium text-white leading-none truncate">{displayName}</span>
            {username && (
              <span className="text-[11px] flex-shrink-0" style={{ color: 'rgba(229,226,225,0.28)' }}>
                @{username}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map(({ label, key }) => (
                <Tag key={key} label={label} highlighted={isMatch(label)} />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Actions — right side */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <RelationshipButton status={relationshipStatus} userId={id} />
        {relationshipStatus === 'friends' && (
          <button
            onClick={() => navigate('/chat', { state: { openDmWith: { id, profileId, username, displayName, avatarUrl } } })}
            className="flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ width: 28, height: 28, color: 'rgba(229,226,225,0.38)', background: 'rgba(255,255,255,0.05)' }}
            aria-label="Message"
          >
            <MessageIcon />
          </button>
        )}
      </div>
    </div>
  )
}
