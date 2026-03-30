import { Routes, Route } from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Meet from './pages/Meet.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Navbar from './components/Navbar.jsx'
import AuthModal from './components/AuthModal.jsx'
import { AuthModalProvider } from './context/AuthModalContext.jsx'

const App = () => {
  return (
    <AuthModalProvider>
      <div className='bg-linear-to-r from-black via-neutral-900 to-gray-900 min-h-screen'>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
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
