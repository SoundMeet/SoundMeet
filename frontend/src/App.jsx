import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Meet from './pages/Meet.jsx'
import MyJams from './pages/MyJams.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Feed from './pages/Feed.jsx'
import Navbar from './components/Navbar.jsx'
import GuestLocationGuard from './components/GuestLocationGuard.jsx'
import AuthModal from './components/AuthModal.jsx'
import BottomNav from './components/BottomNav.jsx'
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { FriendsProvider } from './context/FriendsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { useAuth } from './injectables/Auth.jsx'
import Onboarding from "./pages/Onboarding"
import EventDetailPage from "./pages/EventDetailPage"

/** Redirects unauthenticated users to / and opens the login modal. */
const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  useEffect(() => {
    if (!user) openModal('login')
  }, [user])

  if (!user) return <Navigate to="/" replace />
  return children
}

const OnboardingGuard = ({ children }) => {
  const { isLoggedIn, user, isLoading } = useAuth()
  // Wait for auth to finish resolving before making any redirect decision
  if (isLoading) return null
  // Only redirect logged-in users who haven't finished onboarding
  if (isLoggedIn && user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

const App = () => {
  const { isLoading } = useAuth()
  const location = useLocation()
  const isProfile = location.pathname.startsWith('/profile')

  // Prevent a flash of unauthenticated UI while the session is being restored
  if (isLoading) {
    return (
      <div className='bg-linear-to-r from-black via-neutral-900 to-gray-900 min-h-screen flex items-center justify-center'>
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    )
  }
  return (
    <ToastProvider>
    <FriendsProvider>
      <NotificationsProvider>
        <AuthModalProvider>
          <div className='bg-linear-to-r from-black via-neutral-900 to-gray-900 min-h-screen'>
            <div className={`sticky top-0 z-50 backdrop-blur ${isProfile ? "bg-neutral-900/80" : ""}`}>
              <Navbar />
            </div>
          <div className="pb-[60px] md:pb-0">

            <Routes>
              <Route path="/" element={<OnboardingGuard><GuestLocationGuard><Home /></GuestLocationGuard></OnboardingGuard>} />
              <Route path="/meet" element={<OnboardingGuard><Meet /></OnboardingGuard>} />
              <Route path="/jams" element={<OnboardingGuard><MyJams /></OnboardingGuard>} />
              <Route path="/chat" element={<OnboardingGuard><Chat /></OnboardingGuard>} />
              <Route path="/feed" element={<OnboardingGuard><PrivateRoute><Feed /></PrivateRoute></OnboardingGuard>} />
              <Route path="/profile" element={<OnboardingGuard><Profile /></OnboardingGuard>} />
              <Route path="/profile/:username" element={<OnboardingGuard><Profile /></OnboardingGuard>} />
              <Route path="/settings" element={<OnboardingGuard><Settings /></OnboardingGuard>} />
              <Route path="/jam/:id"  element={<EventDetailPage type="jam" />} />
              <Route path="/show/:id" element={<EventDetailPage type="show" />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Routes>
          </div>
            {/* Auth modal rendered at app root so it can be triggered from anywhere */}
            <AuthModal />
            <BottomNav />
          </div>
        </AuthModalProvider>
      </NotificationsProvider>
    </FriendsProvider>
    </ToastProvider>
  )
}

export default App
