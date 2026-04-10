import { MdPersonSearch } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'
import { FriendListItem } from './FriendListItem'
import { FriendRequestsRow } from './FriendRequestsRow'

// Left sidebar — relationships only. Discovery belongs in the right rail.
export function FriendsSidebar() {
  const { friends } = useFriends()

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Pending friend requests — shown only when they exist */}
      <FriendRequestsRow />

      {/* Friends section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: 'rgba(229,226,225,0.35)' }}
          >
            Friends
          </span>
          {friends.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(229,226,225,0.4)' }}
            >
              {friends.length}
            </span>
          )}
        </div>

        {friends.length === 0 ? (
          <div
            className="flex flex-col items-center py-8 gap-3 rounded-2xl"
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
        ) : (
          <div className="flex flex-col gap-0.5">
            {friends.map((f) => (
              <FriendListItem key={f.id} friend={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
