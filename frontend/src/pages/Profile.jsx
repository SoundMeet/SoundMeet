import { FaUser, FaMusic, FaGuitar } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'

export default function Profile() {
  const { user, isLoggedIn, isLoading } = useAuth()
  const { openModal } = useAuthModal()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Display name: prefer display_name, fall back to username
  const displayName = user?.display_name || user?.username

  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null

  return (
      <div className="min-h-screen px-4 pt-8 pb-24 md:py-16 flex flex-col items-center overflow-x-hidden">      {/* Avatar */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 overflow-hidden"
        style={{
          background: '#1E1E1E',
          boxShadow: '0 0 0 2px rgba(220,46,115,0.4), 0 0 32px rgba(220,46,115,0.12)',
        }}
      >
        {isLoggedIn && user?.pfp ? (
          <img src={user.pfp} alt={displayName} className="w-full h-full object-cover" />
        ) : isLoggedIn && initials ? (
          <span
            className="text-2xl font-bold select-none"
            style={{ fontFamily: 'Sora, sans-serif', color: '#DC2E73' }}
          >
            {initials}
          </span>
        ) : (
          <FaUser className="text-3xl text-white/30" />
        )}
      </div>

      {/* Name / guest state */}
      {isLoggedIn ? (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
          {user?.display_name && user?.username && (
            <p
              className="text-sm mb-8"
              style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}
            >
              @{user.username}
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">Your Profile</h1>
          <p
            className="text-sm mb-4"
            style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}
          >
            Log in to see your profile
          </p>
          <button
            type="button"
            onClick={() => openModal('login')}
            className="mb-8 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: '#DC2E73',
              color: '#fff',
              fontFamily: 'Sora, sans-serif',
              boxShadow: '0 0 20px rgba(220,46,115,0.25)',
            }}
          >
            Log in
          </button>
        </>
      )}

      {/* Stat chips */}
      <div className="flex gap-6 mb-12">
        {[
          { icon: FaMusic,  label: 'Jams',        value: '—' },
          { icon: FaGuitar, label: 'Instruments',  value: user?.instruments_liked?.length ?? '—' },
          { icon: FaUser,   label: 'Friends',      value: '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
            style={{ background: '#1A1A1A' }}
          >
            <Icon className="text-lg mb-1" style={{ color: '#DC2E73' }} />
            <span className="text-xl font-bold text-white">{value}</span>
            <span
              className="text-xs"
              style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Bio card */}
      <div
        className="w-full max-w-lg rounded-2xl px-6 py-5"
        style={{ background: '#1A1A1A' }}
      >
        <h2
          className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.7rem' }}
        >
          About
        </h2>
        <p className="text-sm text-white/50" style={{ fontFamily: 'Sora, sans-serif' }}>
          {isLoggedIn
            ? user?.about || 'No bio yet. Full profile editing coming soon.'
            : 'Log in to view and edit your profile.'}
        </p>
      </div>
    </div>
  )
}
