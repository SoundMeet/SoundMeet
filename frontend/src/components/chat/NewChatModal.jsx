import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useFriends } from '../../context/FriendsContext'
import React from 'react'

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CloseIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function NoFriendsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function NoResultsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
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

// ─── Search logic ─────────────────────────────────────────────────────────────

function filterFriends(friends, query) {
  const q = query.trim()
  if (!q) return friends
  const lq = q.toLowerCase()
  return friends
    .filter((f) => {
      const dn = (f.displayName || '').toLowerCase()
      const un = (f.username || '').toLowerCase()
      return dn.includes(lq) || un.includes(lq)
    })
    .map((f) => {
      let score = 0
      const dn = (f.displayName || '').toLowerCase()
      const un = (f.username || '').toLowerCase()
      if (dn === lq) score += 100
      else if (dn.startsWith(lq)) score += 60
      else if (dn.includes(lq)) score += 40
      if (un === lq) score += 80
      else if (un.startsWith(lq)) score += 50
      else if (un.includes(lq)) score += 30
      return { f, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f)
}

// ─── State views ──────────────────────────────────────────────────────────────

function StateView({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '52px 24px' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)' }}>{icon}</div>
      <div className="text-center">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(229,226,225,0.38)' }}>{title}</p>
        {subtitle && (
          <p className="text-[11px] mt-1" style={{
            color: 'rgba(229,226,225,0.2)', lineHeight: 1.7, maxWidth: 220, margin: '6px auto 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ count }) {
  return (
    <div className="flex items-center gap-2.5 px-4" style={{ paddingTop: 10, paddingBottom: 6 }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(229,226,225,0.2)', letterSpacing: '0.1em' }}>
        Friends
      </span>
      {count != null && (
        <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.15)' }}>{count}</span>
      )}
    </div>
  )
}

// ─── Friend result row ────────────────────────────────────────────────────────

function FriendRow({ friend, onClick }) {
  const { displayName, username, avatarUrl } = friend

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left transition-colors duration-100"
      style={{ padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar src={avatarUrl} name={displayName} size={36} />
      </div>

      {/* Name + handle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-medium text-white leading-none truncate">{displayName}</span>
          {username && (
            <span className="text-[11px] flex-shrink-0" style={{ color: 'rgba(229,226,225,0.28)' }}>
              @{username}
            </span>
          )}
        </div>
      </div>

      {/* Arrow hint */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: 'rgba(229,226,225,0.18)', flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewChatModal({ open, onOpenChange }) {
  const { friends } = useFriends()
  const navigate = useNavigate()
  const [displayQuery, setDisplayQuery] = useState('')
  const [query, setQuery] = useState('')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setDisplayQuery(''); setQuery('') }
  }, [open])

  const handleChange = (e) => {
    const val = e.target.value
    setDisplayQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(val), 150)
  }

  const clearSearch = () => {
    setDisplayQuery('')
    setQuery('')
    inputRef.current?.focus()
  }

  const handleSelectFriend = (friend) => {
    onOpenChange(false)
    navigate('/chat', {
      state: {
        openDmWith: {
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        },
      },
    })
  }

  const results = filterFriends(friends, query)
  const hasQuery = query.trim().length > 0

  let body
  if (friends.length === 0) {
    body = (
      <StateView
        icon={<NoFriendsIcon />}
        title="No friends yet"
        subtitle="Add friends on SoundMeet to start a conversation"
      />
    )
  } else if (hasQuery && results.length === 0) {
    body = (
      <StateView
        icon={<NoResultsIcon />}
        title="No friend matched your search"
        subtitle="Try a different name or username"
      />
    )
  } else {
    body = (
      <>
        <SectionLabel count={hasQuery ? results.length : null} />
        {results.map((friend) => (
          <FriendRow key={friend.id} friend={friend} onClick={() => handleSelectFriend(friend)} />
        ))}
      </>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-start justify-center outline-none"
          style={{ paddingTop: '12vh', pointerEvents: 'none' }}
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col"
            style={{
              pointerEvents: 'auto',
              maxWidth: 480,
              margin: '0 16px',
              background: 'rgba(18,18,20,0.96)',
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.7)',
              maxHeight: '60vh',
              overflow: 'hidden',
            }}
          >
            {/* Search bar — integrated header */}
            <div
              className="flex items-center gap-3 flex-shrink-0"
              style={{
                padding: '0 16px',
                height: 56,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0, display: 'flex' }}>
                <SearchIcon />
              </div>

              <Dialog.Title className="sr-only">New Message</Dialog.Title>

              <input
                ref={inputRef}
                type="text"
                value={displayQuery}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') displayQuery ? clearSearch() : onOpenChange(false)
                  if (e.key === 'Enter' && results.length > 0) handleSelectFriend(results[0])
                }}
                placeholder="Search friends"
                autoFocus
                className="flex-1 bg-transparent text-[14px] text-white outline-none"
                style={{ caretColor: '#DC2E73', minWidth: 0 }}
              />

              {displayQuery ? (
                <button
                  onClick={clearSearch}
                  aria-label="Clear"
                  className="flex items-center justify-center flex-shrink-0 rounded-md transition-colors hover:bg-white/10"
                  style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.3)' }}
                >
                  <CloseIcon size={11} />
                </button>
              ) : (
                <kbd
                  className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-[5px]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.25)',
                    fontFamily: 'inherit',
                  }}
                >
                  ESC
                </kbd>
              )}

              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="flex items-center justify-center flex-shrink-0 rounded-md transition-colors hover:bg-white/10"
                  style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.28)' }}
                >
                  <CloseIcon size={13} />
                </button>
              </Dialog.Close>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {body}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
