/**
 * AvatarButton
 *
 * The navbar avatar trigger. Renders:
 *   – User avatar image   (if user.pfp is set)
 *   – Initials fallback   (if display_name / username available, no image)
 *   – Generic person icon (logged-out / no user data)
 *
 * Visual state:
 *   – Logged out: subtle gray surface + person icon
 *   – Logged in:  dark surface + initials in brand pink
 *   – isOpen:     pink ring glow (signals active menu)
 *
 * Props:
 *   user       – profile object from AuthProvider (or null)
 *   isLoggedIn – boolean from AuthProvider
 *   isOpen     – whether the dropdown is open
 *   onClick    – toggle handler
 */
import { FaUser } from 'react-icons/fa'

function getInitials(user) {
  const name = user?.display_name || user?.username
  if (!name) return null
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AvatarButton({ user, isLoggedIn, isOpen, onClick }) {
  const initials = isLoggedIn ? getInitials(user) : null

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
        background: isLoggedIn ? '#242424' : '#374151',
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
      {user?.pfp ? (
        <img
          src={user.pfp}
          alt={user.display_name ?? user.username ?? 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
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
