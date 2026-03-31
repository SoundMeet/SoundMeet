import { FaBell, FaLock, FaPalette, FaUser } from 'react-icons/fa'

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
      </div>
    </div>
  )
}
