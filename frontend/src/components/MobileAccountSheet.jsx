/**
 * MobileAccountSheet — mobile-only right-side account + social hub.
 *
 * Renders a full-height right-side drawer that consolidates:
 *   - Identity block (avatar, name, username, instruments)
 *   - Account actions (Profile, Settings, Log out)
 *   - Social section — Friends and Requests as collapsible rows
 *
 * Desktop layout: untouched. ProfileDropdown stays as-is on md+.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdSearch, MdClose, MdPersonSearch } from 'react-icons/md'
import { UserSearchModal } from './friends/UserSearchModal'
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { useFriends } from '../context/FriendsContext'
import { useNotifications } from '../context/NotificationsContext'
import AvatarButton from './AvatarButton'
import { FriendListItem } from './friends/FriendListItem'
import { FriendRequestCard } from './friends/FriendRequestCard'
import { SentRequestCard } from './friends/SentRequestCard'
import { formatAvatarUrl } from '../utils/formatAvatarUrl'

// ─── Small primitives ─────────────────────────────────────────────────────────

function RequestBadge({ count }) {
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold leading-none pointer-events-none select-none z-10"
      style={{ background: '#DC2E73', color: '#fff' }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

function SheetDivider() {
  return <div className="h-px mx-5" style={{ background: 'rgba(255,255,255,0.07)' }} />
}

function SectionLabel({ children }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-wider uppercase px-1 mb-2"
      style={{ color: 'rgba(229,226,225,0.3)' }}
    >
      {children}
    </p>
  )
}

// ─── Identity block ───────────────────────────────────────────────────────────

function IdentityBlock({ user, onNavigate }) {
  const displayName = user?.display_name || user?.username || ''
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-150 active:bg-white/[0.04]"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          background: '#242424',
          boxShadow: '0 0 0 1.5px rgba(220,46,115,0.25)',
        }}
      >
        {user?.pfp ? (
          <img
            src={formatAvatarUrl(user.pfp)}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : initials ? (
          <span
            className="text-[13px] font-semibold select-none"
            style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
          >
            {initials}
          </span>
        ) : (
          <FaUser className="text-sm text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] font-semibold text-white leading-snug truncate"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {displayName || 'My Profile'}
        </p>
        {user?.display_name && user?.username && (
          <p
            className="text-[12px] mt-0.5 leading-none truncate"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            @{user.username}
          </p>
        )}
        {user?.instruments?.length > 0 && (
          <p
            className="text-[11px] mt-1 leading-none truncate"
            style={{ color: 'rgba(167,139,250,0.6)' }}
          >
            {user.instruments.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>

      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )
}

// ─── Account action row ───────────────────────────────────────────────────────

function ActionRow({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors duration-150 active:bg-white/[0.04]"
      style={{
        color: danger ? '#fb4040' : 'rgba(229,226,225,0.78)',
        fontFamily: 'Sora, sans-serif',
      }}
    >
      <Icon
        className="text-base flex-shrink-0"
        style={{ opacity: danger ? 0.6 : 0.48 }}
      />
      <span>{label}</span>
    </button>
  )
}

// ─── Collapsible social section ───────────────────────────────────────────────

function CollapsibleRow({ label, count, badge, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-150 active:bg-white/[0.04]"
      >
        <span
          className="flex-1 text-sm font-medium"
          style={{ color: 'rgba(229,226,225,0.78)', fontFamily: 'Sora, sans-serif' }}
        >
          {label}
        </span>

        {/* Count pill */}
        {count != null && count > 0 && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(229,226,225,0.42)',
            }}
          >
            {count}
          </span>
        )}

        {/* Pending badge */}
        {badge > 0 && (
          <span
            className="text-[9px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
            style={{ background: '#DC2E73', color: '#fff' }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            color: 'rgba(255,255,255,0.22)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Friends expanded content ─────────────────────────────────────────────────

function FriendsContent({ friends }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return friends
    const q = search.toLowerCase()
    return friends.filter(
      (f) =>
        f.displayName?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q)
    )
  }, [friends, search])

  return (
    <div className="px-2 pb-2">
      {/* Search */}
      <div className="px-2 pb-2">
        <div className="relative">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"
            style={{ color: 'rgba(229,226,225,0.3)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends…"
            className="w-full pl-8 pr-8 py-2 text-[16px] rounded-xl outline-none text-white bg-white/[0.05] border border-white/[0.07] focus:border-white/[0.15] transition-colors duration-150"
            style={{ caretColor: '#DC2E73' }}
            autoComplete="off"
            spellCheck={false}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
            >
              <MdClose className="text-sm" style={{ color: 'rgba(229,226,225,0.4)' }} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {friends.length === 0 ? (
        <div
          className="flex flex-col items-center py-6 gap-3 rounded-2xl mx-2"
          style={{
            border: '1px dashed rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(220,46,115,0.1)' }}
          >
            <MdPersonSearch className="text-base" style={{ color: 'rgba(220,46,115,0.55)' }} />
          </div>
          <p className="text-xs" style={{ color: 'rgba(229,226,225,0.42)' }}>
            No friends yet
          </p>
        </div>
      ) : search && filtered.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(229,226,225,0.35)' }}>
            No friends match your search
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col gap-0.5 overflow-y-auto"
          style={{ maxHeight: '220px', scrollbarWidth: 'none' }}
        >
          {filtered.map((f) => (
            <FriendListItem key={f.id} friend={f} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Requests expanded content ────────────────────────────────────────────────

function RequestsContent({ incoming, sent }) {
  if (!incoming.length && !sent.length) {
    return (
      <div className="px-4 py-5 text-center">
        <p className="text-xs font-medium" style={{ color: 'rgba(229,226,225,0.42)' }}>
          No pending requests
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-3 flex flex-col gap-4">
      {incoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Received</SectionLabel>
          {incoming.map((req) => (
            <FriendRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
      {sent.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Sent</SectionLabel>
          {sent.map((req) => (
            <SentRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Logged-out CTA block ─────────────────────────────────────────────────────

function LoggedOutCTA({ onLogin, onSignup }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-3">
      <p
        className="text-[13px] text-center"
        style={{ color: 'rgba(229,226,225,0.42)' }}
      >
        Sign in to connect with musicians
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="w-full h-10 rounded-full font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98]"
        style={{
          background: '#DC2E73',
          boxShadow: '0 0 14px rgba(220,46,115,0.28)',
        }}
      >
        Log in
      </button>
      <button
        type="button"
        onClick={onSignup}
        className="w-full h-10 rounded-full font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
        style={{
          color: '#DC2E73',
          border: '1.5px solid rgba(220,46,115,0.35)',
          background: 'transparent',
        }}
      >
        Create account
      </button>
    </div>
  )
}

// ─── Sheet panel ──────────────────────────────────────────────────────────────

function SheetPanel({ onClose, user, isLoggedIn, logout, openModal, friends, sentRequests, incomingRequests, onFindPeople }) {
  const navigate = useNavigate()

  const go = (path) => {
    onClose()
    navigate(path)
  }

  return (
    <motion.div
      key="sheet"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="fixed top-0 right-0 bottom-0 z-[76] flex flex-col overflow-y-auto overscroll-contain"
      style={{
        width: 'min(85vw, 340px)',
        background: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.65), -1px 0 0 rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        scrollbarWidth: 'none',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-3 flex-shrink-0 sticky top-0 z-10"
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(229,226,225,0.32)' }}
        >
          Account
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 active:bg-white/10"
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
          }}
          aria-label="Close menu"
        >
          <MdClose className="text-base" />
        </button>
      </div>

      {/* Identity block */}
      {isLoggedIn && user ? (
        <IdentityBlock user={user} onNavigate={() => go('/profile')} />
      ) : (
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#2A2A2A' }}
          >
            <FaUser className="text-base text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              Welcome
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.38)' }}>
              Sign in to get started
            </p>
          </div>
        </div>
      )}

      <SheetDivider />

      {isLoggedIn ? (
        <>
          {/* Account actions */}
          <div className="flex flex-col py-1">
            <ActionRow icon={FaUser} label="My Profile" onClick={() => go('/profile')} />
            <ActionRow icon={FaCog} label="Settings" onClick={() => go('/settings')} />
            <ActionRow icon={MdPersonSearch} label="Find People" onClick={() => { onClose(); onFindPeople() }} />
          </div>

          <SheetDivider />

          {/* Social — collapsible rows */}
          <div className="flex flex-col py-1">
            <CollapsibleRow label="Friends" count={friends.length}>
              <FriendsContent friends={friends} />
            </CollapsibleRow>

            <div className="h-px mx-5" style={{ background: 'rgba(255,255,255,0.04)' }} />

            <CollapsibleRow
              label="Requests"
              count={sentRequests.length + incomingRequests.length || null}
              badge={incomingRequests.length}
            >
              <RequestsContent incoming={incomingRequests} sent={sentRequests} />
            </CollapsibleRow>
          </div>

          <SheetDivider />

          {/* Log out */}
          <div className="py-1">
            <ActionRow
              icon={FaSignOutAlt}
              label="Log out"
              onClick={() => { onClose(); logout() }}
              danger
            />
          </div>
        </>
      ) : (
        <LoggedOutCTA
          onLogin={() => { onClose(); openModal('login') }}
          onSignup={() => { onClose(); openModal('signup') }}
        />
      )}
    </motion.div>
  )
}

// ─── Root export — avatar trigger + sheet ─────────────────────────────────────

export default function MobileAccountSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, isLoggedIn, logout } = useAuth()
  const { openModal } = useAuthModal()
  const { friends, sentRequests } = useFriends()
  const { friendRequests: incomingRequests } = useNotifications()

  const incomingCount = incomingRequests.length
  const close = () => setIsOpen(false)

  return (
    <>
      <div className="relative flex-shrink-0">
        <AvatarButton
          user={user}
          isLoggedIn={isLoggedIn}
          isOpen={isOpen}
          onClick={() => setIsOpen((v) => !v)}
        />
        {isLoggedIn && incomingCount > 0 && (
          <RequestBadge count={incomingCount} />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[75] bg-black/50"
              onClick={close}
            />

            <SheetPanel
              onClose={close}
              user={user}
              isLoggedIn={isLoggedIn}
              logout={logout}
              openModal={openModal}
              friends={friends}
              sentRequests={sentRequests}
              incomingRequests={incomingRequests}
              onFindPeople={() => setSearchOpen(true)}
            />
          </>
        )}
      </AnimatePresence>

      <UserSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
