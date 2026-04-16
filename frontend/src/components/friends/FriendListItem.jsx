import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdPerson, MdChat, MdMoreVert, MdPersonRemove } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'
import { useToast } from '../../context/ToastContext'
import { DestructiveConfirmSheet } from '../event-detail/DestructiveConfirmSheet'
import { ProfilesRUS } from '../../services/ProfilesRUS'

function FriendAvatar({ displayName, avatarUrl }) {
  const [imgError, setImgError] = useState(false)
  const initials = (displayName || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-9 h-9 xl:w-10 xl:h-10 rounded-full object-cover"
        style={{ background: '#222' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="w-9 h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center flex-shrink-0 select-none"
      style={{ background: 'linear-gradient(135deg, #DC2E73 0%, #c02460 100%)' }}
    >
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  )
}

export function FriendListItem({ friend }) {
  const { displayName, instruments, avatarUrl } = friend
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { removeFriend } = useFriends()
  const { showToast } = useToast()

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleChat = () => {
    setMenuOpen(false)
    navigate('/chat', {
      state: {
        openDmWith: {
          id: friend.id,
          profileId: friend.profileId,
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        },
      },
    })
  }

  const handleViewProfile = () => {
    setMenuOpen(false)
    ProfilesRUS(navigate, friend.profileId)
  }

  const handleConfirmRemove = async () => {
    setRemoving(true)
    try {
      await removeFriend(friend.id)
      setConfirmRemove(false)
      showToast(`${displayName} removed from friends`, 'success')
    } catch {
      showToast('Could not remove friend. Try again.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="group flex items-center gap-3 px-3 py-2.5 xl:px-3.5 xl:py-3 rounded-xl transition-colors duration-150 hover:bg-white/[0.05]">
          {/* Avatar — click opens profile */}
          <button
            onClick={handleViewProfile}
            className="flex-shrink-0 rounded-full transition-transform duration-150 group-hover:scale-[1.06]"
            type="button"
          >
            <FriendAvatar displayName={displayName} avatarUrl={avatarUrl} />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm xl:text-[15px] font-medium text-white truncate leading-snug">{displayName}</p>
            {instruments?.length > 0 ? (
              <p className="text-[11px] xl:text-xs truncate leading-snug" style={{ color: 'rgba(167,139,250,0.65)' }}>
                {instruments.slice(0, 2).join(' · ')}
              </p>
            ) : (
              <p className="text-[11px] xl:text-xs leading-snug" style={{ color: 'rgba(229,226,225,0.28)' }}>
                Musician
              </p>
            )}
          </div>

          {/* Actions: chat + more — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
              onClick={handleChat}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.08]"
              style={{ color: '#DC2E73' }}
              type="button"
              title="Open chat"
            >
              <MdChat className="text-base" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.08]"
              style={{ color: 'rgba(229,226,225,0.45)' }}
              type="button"
              title="More options"
            >
              <MdMoreVert className="text-base" />
            </button>
          </div>
        </div>

        {/* Contextual menu */}
        {menuOpen && (
          <div
            className="absolute right-0 z-50 mt-0.5 w-44 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(22,22,22,0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            }}
          >
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.05]"
              style={{ color: 'rgba(229,226,225,0.85)' }}
            >
              <MdPerson
                className="text-base flex-shrink-0"
                style={{ color: 'rgba(229,226,225,0.4)' }}
              />
              View Profile
            </button>
            <button
              onClick={handleChat}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.05]"
              style={{ color: 'rgba(229,226,225,0.85)' }}
            >
              <MdChat className="text-base flex-shrink-0" style={{ color: '#DC2E73' }} />
              Chat
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <button
              onClick={() => { setMenuOpen(false); setConfirmRemove(true) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-red-500/[0.08]"
              style={{ color: 'rgba(251,100,100,0.85)' }}
            >
              <MdPersonRemove className="text-base flex-shrink-0" />
              Remove Friend
            </button>
          </div>
        )}
      </div>

      {/* Remove friend confirmation */}
      <DestructiveConfirmSheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleConfirmRemove}
        title="Remove friend?"
        body={`You and ${displayName} will no longer appear in each other's friends list.`}
        confirmLabel="Remove Friend"
        cancelLabel="Never mind"
        loading={removing}
      />
    </>
  )
}
