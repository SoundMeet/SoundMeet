import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaLock, FaPalette, FaUser } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { DeleteAccountSheet } from '../components/ui/DeleteAccountSheet'
import { ChangePasswordSheet } from '../components/ui/ChangePasswordSheet'

const SETTING_GROUPS = [
  {
    id: 'account',
    label: 'Account',
    icon: FaUser,
    items: ['Display name', 'Username', 'Email address', 'Profile photo'],
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    icon: FaLock,
    items: ['Profile visibility', 'Block list', 'Two-factor auth'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: FaBell,
    items: ['Jam invites', 'Friend requests', 'Messages', 'Email digests'],
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: FaPalette,
    items: ['Theme', 'Language', 'Accessibility'],
  },
]

function SettingRow({ label, onClick }) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150 w-full text-left hover:bg-white/[0.04]"
      >
        <span className="text-sm text-white/70" style={{ fontFamily: 'Sora, sans-serif' }}>
          {label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150 cursor-pointer hover:bg-white/[0.04]">
      <span className="text-sm text-white/70" style={{ fontFamily: 'Sora, sans-serif' }}>
        {label}
      </span>
      <span className="text-xs px-3 py-1 rounded-full"
        style={{ background: 'rgba(220,46,115,0.12)', color: '#DC2E73', fontFamily: 'Sora, sans-serif' }}>
        Coming soon
      </span>
    </div>
  )
}

function SettingGroup({ group, children }) {
  const Icon = group.icon
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: '#1A1A1A' }}
    >
      {/* Group header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06]">
        <Icon className="text-sm" style={{ color: '#DC2E73' }} />
        <span
          className="text-xs font-semibold uppercase tracking-widest text-white/40"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.68rem' }}
        >
          {group.label}
        </span>
      </div>
      {/* Rows */}
      <div className="px-1 py-1">
        {group.items.map((item) => (
          <SettingRow key={item} label={item} />
        ))}
        {children}
      </div>
    </div>
  )
}

function ChangePasswordSection() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const { changePassword, user }  = useAuth()

  const hasUsablePassword = user?.has_usable_password ?? true

  const handleConfirm = async (currentPassword, newPassword, confirmNewPassword) => {
    setError('')
    setLoading(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword })
      setSheetOpen(false)
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingRow
        label={hasUsablePassword ? 'Change password' : 'Set a password'}
        onClick={() => { setError(''); setSheetOpen(true) }}
      />
      <ChangePasswordSheet
        open={sheetOpen}
        onClose={() => { if (!loading) setSheetOpen(false) }}
        onConfirm={handleConfirm}
        loading={loading}
        hasUsablePassword={hasUsablePassword}
        error={error}
        onClearError={() => setError('')}
      />
    </>
  )
}

function DangerZoneSection() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState('')
  const { deleteAccount, user, isLoggedIn } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()

  if (!isLoggedIn) return null

  const isGoogleUser = user && !user.has_usable_password

  const handlePasswordChange = (val) => { setPassword(val); setError('') }
  const handleConfirmEmailChange = (val) => { setConfirmEmail(val); setError('') }

  const openSheet = () => {
    setError('')
    setPassword('')
    setConfirmEmail('')
    setSheetOpen(true)
  }

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      await deleteAccount({
        password: isGoogleUser ? undefined : password,
        confirmEmail: isGoogleUser ? confirmEmail : undefined,
      })
      openModal('login')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.error || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden mb-4"
        style={{ background: '#1A1A1A', border: '1px solid rgba(251,64,64,0.10)' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(251,64,64,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(251,64,64,0.55)', fontFamily: 'Sora, sans-serif', fontSize: '0.68rem' }}
          >
            Danger Zone
          </span>
        </div>
        <div className="px-1 py-1">
          <button
            onClick={openSheet}
            className="flex items-center justify-between px-4 py-3 rounded-xl w-full text-left transition-colors duration-150 hover:bg-white/[0.04]"
          >
            <span className="text-sm font-medium" style={{ color: 'rgba(251,64,64,0.8)', fontFamily: 'Sora, sans-serif' }}>
              Delete account
            </span>
            <span className="text-xs" style={{ color: 'rgba(251,64,64,0.35)', fontFamily: 'Sora, sans-serif' }}>
              Permanent
            </span>
          </button>
        </div>
      </div>

      <DeleteAccountSheet
        open={sheetOpen}
        onClose={() => { if (!loading) setSheetOpen(false) }}
        onConfirm={handleConfirm}
        loading={loading}
        isGoogleUser={isGoogleUser}
        email={user?.email}
        password={password}
        setPassword={handlePasswordChange}
        confirmEmail={confirmEmail}
        setConfirmEmail={handleConfirmEmailChange}
        error={error}
      />
    </>
  )
}

export default function Settings() {
  return (
    <div className="min-h-screen px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif' }}
        >
          Manage your account preferences. Full settings coming soon.
        </p>

        {SETTING_GROUPS.map((group) => (
          <SettingGroup key={group.id} group={group}>
            {group.id === 'privacy' && <ChangePasswordSection />}
          </SettingGroup>
        ))}

        <DangerZoneSection />
      </div>
    </div>
  )
}
