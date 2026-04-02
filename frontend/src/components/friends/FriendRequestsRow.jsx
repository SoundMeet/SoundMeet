import { useState } from 'react'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { useNotifications } from '../../context/NotificationsContext'
import { FriendRequestCard } from './FriendRequestCard'

export function FriendRequestsRow() {
  const { friendRequests } = useNotifications()
  const [expanded, setExpanded] = useState(true)

  if (friendRequests.length === 0) return null

  return (
    <div>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-2 text-left group"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'rgba(229,226,225,0.5)' }}>
            Friend Requests
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: '#DC2E73', color: '#fff' }}
          >
            {friendRequests.length}
          </span>
        </div>
        {expanded
          ? <MdExpandLess className="text-base" style={{ color: 'rgba(229,226,225,0.4)' }} />
          : <MdExpandMore className="text-base" style={{ color: 'rgba(229,226,225,0.4)' }} />
        }
      </button>

      {/* Request cards */}
      {expanded && (
        <div className="flex flex-col gap-2 mt-1">
          {friendRequests.map((req) => (
            <FriendRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}
