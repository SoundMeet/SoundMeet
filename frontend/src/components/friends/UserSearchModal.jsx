import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { useFriends } from '../../context/FriendsContext'
import { UserSearchResult } from './UserSearchResult'

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

function UsersIcon() {
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

// ─── Search logic ─────────────────────────────────────────────────────────────

function scoreUser(user, lq) {
  let score = 0
  const dn = (user.displayName || '').toLowerCase()
  const un = (user.username || '').toLowerCase()
  const ab = (user.about || '').toLowerCase()

  if (dn === lq) score += 100
  else if (dn.startsWith(lq)) score += 60
  else if (dn.includes(lq)) score += 40

  if (un === lq) score += 80
  else if (un.startsWith(lq)) score += 50
  else if (un.includes(lq)) score += 30

  if (user.instruments.some((i) => i.toLowerCase() === lq)) score += 25
  else if (user.instruments.some((i) => i.toLowerCase().includes(lq))) score += 18

  if (user.genres.some((g) => g.toLowerCase() === lq)) score += 20
  else if (user.genres.some((g) => g.toLowerCase().includes(lq))) score += 14

  if (user.vibes.some((v) => v.toLowerCase() === lq)) score += 15
  else if (user.vibes.some((v) => v.toLowerCase().includes(lq))) score += 10

  if (ab.includes(lq)) score += 5
  return score
}

function filterAndRank(users, query) {
  const q = query.trim()
  if (!q) return users.slice(0, 40)
  const lq = q.toLowerCase()
  return users
    .filter((u) => {
      const dn = (u.displayName || '').toLowerCase()
      const un = (u.username || '').toLowerCase()
      const ab = (u.about || '').toLowerCase()
      return (
        dn.includes(lq) ||
        un.includes(lq) ||
        u.instruments.some((i) => i.toLowerCase().includes(lq)) ||
        u.genres.some((g) => g.toLowerCase().includes(lq)) ||
        u.vibes.some((v) => v.toLowerCase().includes(lq)) ||
        ab.includes(lq)
      )
    })
    .map((u) => ({ u, s: scoreUser(u, lq) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.u)
}

// ─── Empty / loading / error states ──────────────────────────────────────────

function StateView({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '52px 24px' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)' }}>{icon}</div>
      <div className="text-center">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(229,226,225,0.38)' }}>{title}</p>
        {subtitle && (
          <p className="text-[11px] mt-1" style={{ color: 'rgba(229,226,225,0.2)', lineHeight: 1.7, maxWidth: 220, margin: '6px auto 0' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '52px 24px' }}>
      <div style={{
        width: 28, height: 28,
        border: '1.5px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(220,46,115,0.6)',
        borderRadius: '50%',
        animation: 'usm-spin 0.7s linear infinite',
      }} />
      <p className="text-[12px]" style={{ color: 'rgba(229,226,225,0.25)' }}>Loading&hellip;</p>
      <style>{`@keyframes usm-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ count }) {
  return (
    <div className="flex items-center gap-2.5 px-4" style={{ paddingTop: 10, paddingBottom: 6 }}>
      <span className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(229,226,225,0.2)', letterSpacing: '0.1em' }}>
        People
      </span>
      {count != null && (
        <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.15)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserSearchModal({ open, onOpenChange }) {
  const { allUsers, allUsersLoading, allUsersError, allUsersFetched, fetchAllUsers } = useFriends()
  const [displayQuery, setDisplayQuery] = useState('')
  const [query, setQuery] = useState('')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && !allUsersFetched && !allUsersLoading) fetchAllUsers()
    if (open) { setDisplayQuery(''); setQuery('') }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const val = e.target.value
    setDisplayQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(val), 180)
  }

  const clearSearch = () => {
    setDisplayQuery('')
    setQuery('')
    inputRef.current?.focus()
  }

  const results = filterAndRank(allUsers, query)
  const hasQuery = query.trim().length > 0

  let body
  if (allUsersLoading) {
    body = <LoadingState />
  } else if (allUsersError) {
    body = <StateView icon={<NoResultsIcon />} title="Could not load people" subtitle={allUsersError || 'Something went wrong. Please try again.'} />
  } else if (allUsers.length === 0) {
    body = <StateView icon={<UsersIcon />} title="Find musicians on SoundMeet" subtitle="Search by name, instrument, genre, or vibe" />
  } else if (hasQuery && results.length === 0) {
    body = <StateView icon={<NoResultsIcon />} title="No results" subtitle={`Nothing matched "${query.trim()}". Try a different keyword.`} />
  } else {
    body = (
      <>
        <SectionLabel count={hasQuery ? results.length : null} />
        {results.map((user) => (
          <UserSearchResult key={user.id} user={user} activeQuery={query.trim()} />
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
          style={{ paddingTop: '68px', pointerEvents: 'none' }}
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col"
            style={{
              pointerEvents: 'auto',
              maxWidth: 580,
              margin: '0 16px',
              background: 'rgba(18,18,20,0.96)',
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.7)',
              maxHeight: 'calc(100dvh - 80px)',
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

              <Dialog.Title className="sr-only">Find People</Dialog.Title>

              <input
                ref={inputRef}
                type="text"
                value={displayQuery}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Escape' && (displayQuery ? clearSearch() : onOpenChange(false))}
                placeholder="Find people by name, instrument, genre or vibe"
                autoFocus
                className="flex-1 bg-transparent text-base sm:text-[14px] text-white outline-none"
                style={{ caretColor: '#DC2E73', minWidth: 0 }}
              />

              {displayQuery && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear"
                  className="flex items-center justify-center flex-shrink-0 rounded-md transition-colors hover:bg-white/10"
                  style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.3)' }}
                >
                  <CloseIcon size={11} />
                </button>
              )}

              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="flex items-center justify-center flex-shrink-0 rounded-md transition-colors hover:bg-white/10"
                  style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.28)' }}
                >
                  <CloseIcon size={13} />
                </button>
              </Dialog.Close>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'none' }}>
              {body}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
