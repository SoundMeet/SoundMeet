import { Routes, Route } from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Meet from './pages/Meet.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Navbar from './components/Navbar.jsx'
import { MockAuthProvider } from './context/MockAuthContext.jsx'

const App = () => {
  return (
    <MockAuthProvider>
      <div className='bg-gradient-to-r from-black via-neutral-900 to-gray-900 min-h-screen'>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/meet" element={<Meet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </MockAuthProvider>
  )
}

export default App
