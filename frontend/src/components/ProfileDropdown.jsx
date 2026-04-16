/**
 * ProfileDropdown
 *
 * Composes AvatarButton + AppDropdown into the profile menu.
 * Uses real AuthProvider (not MockAuth).
 *
 * Behavior:
 *   – Unauthenticated: clicking Profile or Settings opens the auth modal
 *   – Unauthenticated: "Log in" / "Sign up" items open the auth modal
 *   – Authenticated: Profile and Settings navigate directly; Log out clears session
 *
 * To add menu items: add an entry to buildMenuItems() with
 * { id, label, icon, onClick, variant?, dividerAbove? }
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaCog, FaInfoCircle, FaSignInAlt, FaSignOutAlt, FaUserPlus } from 'react-icons/fa'
import AppDropdown from './ui/AppDropdown'
import AvatarButton from './AvatarButton'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { formatAvatarUrl } from '../utils/formatAvatarUrl'

// ─── Menu item config ─────────────────────────────────────────────────────────

function buildMenuItems({ isLoggedIn, logout, navigate, openModal, onClose }) {
  const go = (path) => {
    navigate(path)
    onClose()
  }

  // If not logged in, intercept and open auth modal instead
  const guardedGo = (path) => {
    if (!isLoggedIn) {
      openModal('login')
      onClose()
      return
    }
    go(path)
  }

  const shared = [
    {
      id: 'profile',
      label: 'Profile',
      icon: FaUser,
      onClick: () => guardedGo('/profile'),
    },
    {
      id: 'about',
      label: 'About',
      icon: FaInfoCircle,
      onClick: () => go('/about'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
      onClick: () => guardedGo('/settings'),
    },
  ]

  if (isLoggedIn) {
    return [
      ...shared,
      {
        id: 'logout',
        label: 'Log out',
        icon: FaSignOutAlt,
        onClick: () => {
          logout()
          onClose()
        },
        variant: 'danger',
        dividerAbove: true,
      },
    ]
  }

  return [
    ...shared,
    {
      id: 'login',
      label: 'Log in',
      icon: FaSignInAlt,
      onClick: () => {
        openModal('login')
        onClose()
      },
      variant: 'accent',
      dividerAbove: true,
    },
    {
      id: 'signup',
      label: 'Sign up',
      icon: FaUserPlus,
      onClick: () => {
        openModal('signup')
        onClose()
      },
      variant: 'accent',
    },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserHeader({ user }) {
  const displayName = user?.display_name || user?.username || ''
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 mx-2 mt-2 mb-1 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Mini avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: '#2A2A2A' }}
      >
        {user?.pfp ? (
          <img src={formatAvatarUrl(user.pfp)} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span
            className="text-xs font-semibold select-none"
            style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Display name + @username */}
      <div className="min-w-0">
        <p
          className="text-sm font-semibold text-white truncate"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {user?.display_name || user?.username}
        </p>
        {user?.display_name && user?.username && (
          <p
            className="text-xs truncate"
            style={{ fontFamily: 'Sora, sans-serif', color: 'rgba(255,255,255,0.38)' }}
          >
            @{user.username}
          </p>
        )}
      </div>
    </div>
  )
}

function MenuDivider() {
  return (
    <div
      className="mx-4 my-1.5"
      style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }}
      role="separator"
    />
  )
}

function MenuItem({ item }) {
  const Icon = item.icon
  const isAccent = item.variant === 'accent'
  const isDanger = item.variant === 'danger'
  const textColor = isDanger ? '#fb4040' : isAccent ? '#DC2E73' : 'rgba(255,255,255,0.78)'

  return (
    <button
      role="menuitem"
      type="button"
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors duration-150 focus:outline-none hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
      style={{ fontFamily: 'Sora, sans-serif', color: textColor }}
    >
      <Icon className="text-base flex-shrink-0 opacity-60" />
      <span>{item.label}</span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoggedIn, logout } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()

  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  const menuItems = buildMenuItems({ isLoggedIn, logout, navigate, openModal, onClose: close })

  return (
    <AppDropdown
      trigger={
        <AvatarButton
          user={user}
          isLoggedIn={isLoggedIn}
          isOpen={isOpen}
          onClick={toggle}
        />
      }
      isOpen={isOpen}
      onClose={close}
      align="right"
      minWidth={232}
    >
      {/* Logged-in header */}
      {isLoggedIn && user && <UserHeader user={user} />}

      {/* Menu items */}
      <nav className="px-2 py-2" role="menu">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.dividerAbove && <MenuDivider />}
            <MenuItem item={item} />
          </div>
        ))}
      </nav>
    </AppDropdown>
  )
}
