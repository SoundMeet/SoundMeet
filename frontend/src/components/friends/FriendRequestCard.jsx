import { useNotifications } from '../../context/NotificationsContext'

export function FriendRequestCard({ request }) {
  const { acceptRequest, declineRequest } = useNotifications()
  const { fromUser } = request

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 hover:border-white/[0.13] hover:bg-white/[0.04]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* User info */}
      <div className="flex items-center gap-2.5">
        <img
          src={fromUser.avatarUrl}
          alt={fromUser.displayName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          style={{ background: '#222' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{fromUser.displayName}</p>
          <p className="text-[11px] truncate" style={{ color: 'rgba(229,226,225,0.4)' }}>
            {fromUser.instruments.join(' · ')}
          </p>
          {fromUser.mutualFriendsCount > 0 && (
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(229,226,225,0.3)' }}>
              {fromUser.mutualFriendsCount} mutual friend{fromUser.mutualFriendsCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => acceptRequest(fromUser.id)}
          className="flex-1 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
        >
          Accept
        </button>
        <button
          onClick={() => declineRequest(fromUser.id)}
          className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 hover:bg-red-500/10 hover:text-red-400/70 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(229,226,225,0.6)',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  )
}
