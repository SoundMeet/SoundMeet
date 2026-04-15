import { Link, useLocation } from 'react-router-dom'
import { navItems } from '../constants'

const TAB_ICONS = {
  1: (
    // Discover — compass
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
    </svg>
  ),
  2: (
    // Meet — two people
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  3: (
    // My Jams — music note
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  4: (
    // Chat — speech bubble
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  5: (
    // Feed — broadcast signal
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" strokeWidth="0" />
    </svg>
  ),
}

const BottomNav = () => {
    const location = useLocation()

    if (location.pathname === '/onboarding') return null

    return (
        <nav
            className="bottom-nav-mobile fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10"
            style={{
                background: 'rgba(18,18,18,0.97)',
                backdropFilter: 'blur(20px)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                height: '64px',
            }}
        >
            {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
                        style={{
                            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)',
                            fontFamily: 'Sora, sans-serif',
                        }}
                    >
                        {TAB_ICONS[item.id]}
                        <span
                            className="text-[10px] tracking-[0.02em] font-medium leading-none"
                            style={isActive ? {
                                background: 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            } : {
                                color: 'rgba(255,255,255,0.38)',
                                transition: 'color 0.2s',
                            }}
                        >
                            {item.name}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}

export default BottomNav
