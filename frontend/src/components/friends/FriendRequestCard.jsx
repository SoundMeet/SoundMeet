import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'

export function FriendRequestCard({ request }) {
  const { acceptRequest, declineRequest } = useNotifications()
  const navigate = useNavigate()
  const { id: notificationId, referenceId, fromUser } = request

  if (!fromUser) return null

  const initials = (fromUser.displayName || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const instruments = fromUser.instruments ?? []

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* User info row */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/profile')}
          className="flex-shrink-0 rounded-full transition-opacity hover:opacity-80"
          type="button"
        >
          {fromUser.avatarUrl ? (
            <img
              src={fromUser.avatarUrl}
              alt={fromUser.displayName}
              className="w-10 h-10 rounded-full object-cover"
              style={{ background: '#222' }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
              style={{ background: 'linear-gradient(135deg, rgba(220,46,115,0.5), rgba(251,64,64,0.3))' }}
            >
              {initials}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-snug">
            {fromUser.displayName}
          </p>
          {instruments.length > 0 && (
            <p className="text-[11px] truncate leading-snug" style={{ color: 'rgba(229,226,225,0.4)' }}>
              {instruments.join(' · ')}
            </p>
          )}
          {(fromUser.mutualFriendsCount ?? 0) > 0 && (
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(229,226,225,0.28)' }}>
              {fromUser.mutualFriendsCount} mutual
              {fromUser.mutualFriendsCount !== 1 ? ' friends' : ' friend'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => acceptRequest(notificationId, referenceId)}
          className="flex-1 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
          type="button"
        >
          Accept
        </button>
        <button
          onClick={() => declineRequest(notificationId, referenceId)}
          className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 hover:bg-red-500/10 hover:text-red-400/70 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(229,226,225,0.6)',
          }}
          type="button"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
