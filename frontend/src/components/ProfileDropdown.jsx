/**
 * ProfileDropdown
 *
 * Composes AvatarButton + AppDropdown into the profile menu.
 * Menu items are config-driven so adding new items later requires
 * only a new entry in buildMenuItems() — no JSX surgery needed.
 *
 * To extend with more items (billing, admin, theme toggle, etc.):
 *   1. Add an entry to the items array in buildMenuItems()
 *   2. Give it a unique id, label, icon, and onClick handler
 *   3. Optionally add a variant: 'accent' | 'danger' for color treatment
 *   4. Optionally add dividerAbove: true to insert a separator before the item
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaCog, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa'
import AppDropdown from './ui/AppDropdown'
import AvatarButton from './AvatarButton'
import { useAuth } from '../context/MockAuthContext'

// ─── Menu item config ────────────────────────────────────────────────────────

/**
 * Builds the ordered list of menu items based on auth state.
 * Each item: { id, label, icon, onClick, variant?, dividerAbove? }
 */
function buildMenuItems({ isAuthenticated, login, logout, navigate, onClose }) {
  const go = (path) => {
    navigate(path)
    onClose()
  }

  const shared = [
    {
      id: 'profile',
      label: 'Profile',
      icon: FaUser,
      onClick: () => go('/profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FaCog,
      onClick: () => go('/settings'),
    },
  ]

  if (isAuthenticated) {
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
        login()
        onClose()
      },
      variant: 'accent',
      dividerAbove: true,
    },
  ]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UserHeader({ user }) {
  const initials = user.name
    ?.trim()
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
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-xs font-semibold select-none"
            style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Name + username */}
      <div className="min-w-0">
        <p
          className="text-sm font-semibold text-white truncate"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {user.name}
        </p>
        <p
          className="text-xs truncate"
          style={{ fontFamily: 'Sora, sans-serif', color: 'rgba(255,255,255,0.38)' }}
        >
          {user.username}
        </p>
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

  const defaultColor = 'rgba(255,255,255,0.78)'
  const accentColor = '#DC2E73'
  const dangerColor = '#fb4040'
  const textColor = isDanger ? dangerColor : isAccent ? accentColor : defaultColor

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
  const { user, login, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  const menuItems = buildMenuItems({ isAuthenticated, login, logout, navigate, onClose: close })

  return (
    <AppDropdown
      trigger={<AvatarButton user={user} isOpen={isOpen} onClick={toggle} />}
      isOpen={isOpen}
      onClose={close}
      align="right"
      minWidth={232}
    >
      {/* Logged-in header */}
      {isAuthenticated && <UserHeader user={user} />}

      {/* Menu items */}
      <nav className="px-2 py-2">
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
