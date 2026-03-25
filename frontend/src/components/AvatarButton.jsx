/**
 * AvatarButton
 *
 * The navbar avatar trigger. Renders:
 *   – User avatar image (if avatarUrl is set)
 *   – Initials fallback (if name is available, no image)
 *   – Generic icon (logged-out / no user data)
 *
 * Visual state changes:
 *   – Logged out: subtle gray surface + person icon
 *   – Logged in:  dark surface + initials in brand pink
 *   – isOpen:     pink ring glow to signal active state
 *
 * Fully accessible: aria-haspopup, aria-expanded, aria-label.
 */
import { FaUser } from 'react-icons/fa'

function getInitials(name) {
  if (!name) return null
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AvatarButton({ user, isOpen, onClick }) {
  const isAuth = user?.isAuthenticated
  const initials = isAuth ? getInitials(user?.name) : null

  const ringStyle = isOpen
    ? '0 0 0 2px #DC2E73, 0 0 12px rgba(220,46,115,0.35)'
    : '0 0 0 2px transparent'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Open account menu"
      className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none transition-all duration-200"
      style={{
        background: isAuth ? '#242424' : '#374151',
        boxShadow: ringStyle,
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(220,46,115,0.45)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.boxShadow = '0 0 0 2px transparent'
        }
      }}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name ?? 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide broken image; initials/icon will show via sibling logic
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : initials ? (
        <span
          className="text-[11px] font-semibold leading-none select-none"
          style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
        >
          {initials}
        </span>
      ) : (
        <FaUser className="text-sm text-gray-300" />
      )}
    </button>
  )
}
