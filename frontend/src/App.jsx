import { Routes, Route } from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Meet from './pages/Meet.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Navbar from './components/Navbar.jsx'
import GuestLocationGuard from './components/GuestLocationGuard.jsx'
import AuthModal from './components/AuthModal.jsx'
import { AuthModalProvider } from './context/AuthModalContext.jsx'
import { useAuth } from './injectables/Auth.jsx'

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
    <AuthModalProvider>
      <div className='bg-linear-to-r from-black via-neutral-900 to-gray-900 min-h-screen'>
        <Navbar />
        <Routes>
          <Route path="/" element={<GuestLocationGuard><Home /></GuestLocationGuard>} />
          <Route path="/meet" element={<Meet />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Auth modal rendered at app root so it can be triggered from anywhere */}
        <AuthModal />
      </div>
    </AuthModalProvider>
  )
}

export default App
