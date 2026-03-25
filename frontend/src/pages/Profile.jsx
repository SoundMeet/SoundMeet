import { FaUser, FaMusic, FaGuitar } from 'react-icons/fa'
import { useAuth } from '../context/MockAuthContext'

export default function Profile() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen px-4 py-16 flex flex-col items-center">
      {/* Avatar */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 overflow-hidden"
        style={{
          background: '#1E1E1E',
          boxShadow: '0 0 0 2px rgba(220,46,115,0.4), 0 0 32px rgba(220,46,115,0.12)',
        }}
      >
        {isAuthenticated && user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : isAuthenticated ? (
          <span
            className="text-2xl font-bold select-none"
            style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
          >
            {user?.name
              ?.trim()
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
        ) : (
          <FaUser className="text-3xl text-white/30" />
        )}
      </div>

      {/* Name / guest state */}
      {isAuthenticated ? (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">{user?.name}</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}>
            {user?.username}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">Your Profile</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}>
            Log in to see your profile
          </p>
        </>
      )}

      {/* Placeholder stat chips */}
      <div className="flex gap-6 mb-12">
        {[
          { icon: FaMusic, label: 'Jams', value: isAuthenticated ? '12' : '—' },
          { icon: FaGuitar, label: 'Instruments', value: isAuthenticated ? '3' : '—' },
          { icon: FaUser, label: 'Friends', value: isAuthenticated ? '28' : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
            style={{ background: '#1A1A1A' }}
          >
            <Icon className="text-lg mb-1" style={{ color: '#DC2E73' }} />
            <span className="text-xl font-bold text-white">{value}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Placeholder bio card */}
      <div
        className="w-full max-w-lg rounded-2xl px-6 py-5"
        style={{ background: '#1A1A1A' }}
      >
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.7rem' }}>
          About
        </h2>
        <p className="text-sm text-white/50" style={{ fontFamily: 'Sora, sans-serif' }}>
          {isAuthenticated
            ? 'Your bio will appear here. This page is a placeholder — full profile editing coming soon.'
            : 'Log in to view and edit your profile.'}
        </p>
      </div>
    </div>
  )
}
