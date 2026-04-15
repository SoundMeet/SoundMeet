import { Link, useLocation } from 'react-router-dom'
import { navItems } from '../constants'

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
                height: '60px',
            }}
        >
            {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className="relative flex flex-col items-center justify-center flex-1 h-full text-sm font-medium"
                        style={{
                            color: '#ffffff',
                            fontFamily: 'Sora, sans-serif',
                        }}
                    >
                        {item.name}
                        {/* Growing underline — matches desktop navbar */}
                        <div
                            className="absolute bottom-3 left-0 h-0.5 rounded-lg bg-[#DC2E73] transition-all duration-300"
                            style={{ width: isActive ? '100%' : '0%' }}
                        />
                    </Link>
                )
            })}
        </nav>
    )
}

export default BottomNav