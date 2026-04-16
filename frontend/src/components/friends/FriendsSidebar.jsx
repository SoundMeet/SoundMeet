import { useState, useMemo } from 'react'
import { MdPersonSearch, MdSearch, MdClose } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'
import { useNotifications } from '../../context/NotificationsContext'
import { FriendListItem } from './FriendListItem'
import { FriendRequestCard } from './FriendRequestCard'
import { SentRequestCard } from './SentRequestCard'

export function FriendsSidebar() {
  const { friends, sentRequests } = useFriends()
  const { friendRequests } = useNotifications()
  const [tab, setTab] = useState('friends')
  const [search, setSearch] = useState('')

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends
    const q = search.toLowerCase()
    return friends.filter(
      (f) =>
        f.displayName?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q)
    )
  }, [friends, search])

  const incomingCount = friendRequests.length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 lg:px-4 lg:pt-4 lg:pb-3 xl:px-5 xl:pt-5 xl:pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm lg:text-sm xl:text-base font-bold text-white tracking-tight">Friends</h2>
            <p className="text-[11px] xl:text-xs mt-0.5" style={{ color: 'rgba(229,226,225,0.35)' }}>
              {friends.length} connection{friends.length !== 1 ? 's' : ''}
            </p>
          </div>
          {incomingCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: '#DC2E73', color: '#fff' }}
            >
              {incomingCount}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 xl:px-5 xl:pb-4 shrink-0">
        <div className="relative">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base xl:text-lg pointer-events-none"
            style={{ color: 'rgba(229,226,225,0.3)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends…"
            className="w-full pl-8 pr-8 py-2 xl:py-2.5 xl:pl-9 text-sm xl:text-sm rounded-xl outline-none text-white bg-white/[0.05] border border-white/[0.07] focus:border-white/[0.15] transition-colors duration-150"
            style={{ caretColor: '#DC2E73' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
              type="button"
            >
              <MdClose className="text-sm" style={{ color: 'rgba(229,226,225,0.4)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 xl:px-5 xl:pb-4 shrink-0">
        <div
          className="flex rounded-xl p-0.5 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <TabButton active={tab === 'friends'} onClick={() => setTab('friends')}>
            Friends
            {friends.length > 0 && (
              <span className="ml-1.5 opacity-50 text-[10px]">{friends.length}</span>
            )}
          </TabButton>
          <TabButton active={tab === 'requests'} onClick={() => setTab('requests')}>
            Requests
            {incomingCount > 0 && (
              <span
                className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full leading-none"
                style={{ background: '#DC2E73', color: '#fff' }}
              >
                {incomingCount}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 xl:px-3" style={{ scrollbarWidth: 'none' }}>
        {tab === 'friends' ? (
          <FriendsTabContent
            friends={filteredFriends}
            allFriends={friends}
            searchActive={!!search.trim()}
          />
        ) : (
          <RequestsTabContent
            incoming={friendRequests}
            sent={sentRequests}
          />
        )}
      </div>
    </div>
  )
}

// ─── Tab button ──────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex-1 flex items-center justify-center py-1.5 xl:py-2 rounded-[9px] text-xs xl:text-[13px] font-semibold transition-all duration-150"
      style={{
        background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
        color: active ? 'rgba(229,226,225,0.9)' : 'rgba(229,226,225,0.4)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-wider uppercase px-1 mb-1"
      style={{ color: 'rgba(229,226,225,0.3)' }}
    >
      {children}
    </p>
  )
}

// ─── Friends tab ──────────────────────────────────────────────────────────────

function FriendsTabContent({ friends, allFriends, searchActive }) {
  if (allFriends.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-8 gap-3 rounded-2xl mx-2 mt-1"
        style={{
          border: '1px dashed rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(220,46,115,0.1)' }}
        >
          <MdPersonSearch className="text-lg" style={{ color: 'rgba(220,46,115,0.55)' }} />
        </div>
        <div className="text-center px-4">
          <p className="text-xs font-medium" style={{ color: 'rgba(229,226,225,0.55)' }}>
            No friends yet
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.28)' }}>
            Find musicians using the Discover panel
          </p>
        </div>
      </div>
    )
  }

  if (searchActive && friends.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs" style={{ color: 'rgba(229,226,225,0.35)' }}>
          No friends match your search
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {friends.map((f) => (
        <FriendListItem key={f.id} friend={f} />
      ))}
    </div>
  )
}

// ─── Requests tab ─────────────────────────────────────────────────────────────

function RequestsTabContent({ incoming, sent }) {
  const hasIncoming = incoming.length > 0
  const hasSent = sent.length > 0

  if (!hasIncoming && !hasSent) {
    return (
      <div className="py-8 text-center px-4">
        <p className="text-xs font-medium" style={{ color: 'rgba(229,226,225,0.45)' }}>
          No pending requests
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'rgba(229,226,225,0.25)' }}>
          Friend requests will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {hasIncoming && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Incoming</SectionLabel>
          {incoming.map((req) => (
            <FriendRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
      {hasSent && (
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
