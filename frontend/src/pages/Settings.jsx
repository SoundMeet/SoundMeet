import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaLock, FaPalette, FaUser } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { DeleteAccountSheet } from '../components/ui/DeleteAccountSheet'

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
    items: ['Profile visibility', 'Block list', 'Change password', 'Two-factor auth'],
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

function SettingRow({ label }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150 cursor-pointer hover:bg-white/[0.04]"
    >
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

function SettingGroup({ group }) {
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
      </div>
    </div>
  )
}

function DangerZoneSection() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmUsername, setConfirmUsername] = useState('')
  const [error, setError] = useState('')
  const { deleteAccount, user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  if (!isLoggedIn) return null

  const isGoogleUser = user && !user.has_usable_password

  const openSheet = () => {
    setError('')
    setPassword('')
    setConfirmUsername('')
    setSheetOpen(true)
  }

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      await deleteAccount({
        password: isGoogleUser ? undefined : password,
        confirmUsername: isGoogleUser ? confirmUsername : undefined,
      })
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
        username={user?.username}
        password={password}
        setPassword={setPassword}
        confirmUsername={confirmUsername}
        setConfirmUsername={setConfirmUsername}
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
          <SettingGroup key={group.id} group={group} />
        ))}

        <DangerZoneSection />
      </div>
    </div>
  )
}
