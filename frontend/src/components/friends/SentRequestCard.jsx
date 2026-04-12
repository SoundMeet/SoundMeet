import { useState } from 'react'
import { useFriends } from '../../context/FriendsContext'
import { useToast } from '../../context/ToastContext'

export function SentRequestCard({ request }) {
  const [cancelling, setCancelling] = useState(false)
  const { cancelSentRequest } = useFriends()
  const { showToast } = useToast()

  const { toUser } = request
  if (!toUser) return null

  const initials = (toUser.displayName || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelSentRequest(request.id)
      showToast('Friend request cancelled', 'success')
    } catch {
      showToast('Could not cancel request. Try again.', 'error')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-2.5 transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Avatar */}
      {toUser.avatarUrl ? (
        <img
          src={toUser.avatarUrl}
          alt={toUser.displayName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          style={{ background: '#222' }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(220,46,115,0.35), rgba(251,64,64,0.22))',
          }}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate leading-snug">
          {toUser.displayName}
        </p>
        <p
          className="text-[11px] leading-snug"
          style={{ color: 'rgba(229,226,225,0.35)' }}
        >
          Request pending
        </p>
      </div>

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="flex-shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all duration-150 disabled:opacity-40 hover:bg-red-500/[0.1] hover:text-red-400/80 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(229,226,225,0.55)',
        }}
        type="button"
      >
        {cancelling ? '…' : 'Cancel'}
      </button>
    </div>
  )
}
