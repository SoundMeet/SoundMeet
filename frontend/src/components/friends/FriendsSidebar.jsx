import { MdPersonSearch } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'
import { FriendListItem } from './FriendListItem'
import { FriendRequestsRow } from './FriendRequestsRow'

export function FriendsSidebar({ onOpenSearch }) {
  const { friends } = useFriends()

  const onlineFriends = friends.filter((f) => f.isOnline)
  const offlineFriends = friends.filter((f) => !f.isOnline)

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Find People button */}
      <button
        onClick={onOpenSearch}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
      >
        <MdPersonSearch className="text-lg" />
        Find People
      </button>

      {/* Friend Requests */}
      <FriendRequestsRow />

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Friends list heading */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold" style={{ color: 'rgba(229,226,225,0.5)' }}>
          Friends
        </span>
        <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
          {friends.length}
        </span>
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <span className="text-2xl">🎸</span>
          <p className="text-xs text-center" style={{ color: 'rgba(229,226,225,0.35)' }}>
            No friends yet.<br />Find people to connect with.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {/* Online first */}
          {onlineFriends.map((f) => (
            <FriendListItem key={f.id} friend={f} />
          ))}
          {offlineFriends.map((f) => (
            <FriendListItem key={f.id} friend={f} />
          ))}
        </div>
      )}
    </div>
  )
}
