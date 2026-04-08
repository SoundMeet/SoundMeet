import { Routes, Route, Navigate } from "react-router-dom"
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
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { FriendsProvider } from './context/FriendsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { useAuth } from './injectables/Auth.jsx'

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

const App = () => {
  const { isLoading } = useAuth()

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
    <NotificationsProvider>
      <FriendsProvider>
        <AuthModalProvider>
          <div className='bg-linear-to-r from-black via-neutral-900 to-gray-900 min-h-screen'>
            <div className="sticky top-0 z-50">
              <Navbar />
            </div>
            <Routes>
              <Route path="/" element={<GuestLocationGuard><Home /></GuestLocationGuard>} />
              <Route path="/meet" element={<Meet />} />
              <Route path="/jams" element={<MyJams />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Auth modal rendered at app root so it can be triggered from anywhere */}
            <AuthModal />
          </div>
        </AuthModalProvider>
      </FriendsProvider>
    </NotificationsProvider>
    </ToastProvider>
  )
}

export default App
