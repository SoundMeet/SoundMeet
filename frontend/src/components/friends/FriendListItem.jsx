import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdPerson, MdChat } from 'react-icons/md'

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
        className="w-9 h-9 rounded-full object-cover transition-transform duration-150 group-hover:scale-105"
        style={{ background: '#222' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-105 select-none"
      style={{ background: 'linear-gradient(135deg, #DC2E73 0%, #c02460 100%)' }}
    >
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  )
}

export function FriendListItem({ friend }) {
  const { displayName, instruments, avatarUrl } = friend
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

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
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        },
      },
    })
  }

  const handleViewProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 hover:bg-white/[0.05]"
        type="button"
      >
        <div className="flex-shrink-0">
          <FriendAvatar displayName={displayName} avatarUrl={avatarUrl} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{displayName}</p>
          {instruments?.length > 0 ? (
            <p className="text-[11px] truncate" style={{ color: 'rgba(167,139,250,0.65)' }}>
              {instruments.slice(0, 2).join(' · ')}
            </p>
          ) : (
            <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.28)' }}>Musician</p>
          )}
        </div>
      </button>

      {menuOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-0.5 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(28,28,28,0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.05]"
            style={{ color: 'rgba(229,226,225,0.85)' }}
          >
            <MdPerson className="text-base flex-shrink-0" style={{ color: 'rgba(229,226,225,0.4)' }} />
            View Profile
          </button>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <button
            onClick={handleChat}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.05]"
            style={{ color: 'rgba(229,226,225,0.85)' }}
          >
            <MdChat className="text-base flex-shrink-0" style={{ color: '#DC2E73' }} />
            Chat
          </button>
        </div>
      )}
    </div>
  )
}
