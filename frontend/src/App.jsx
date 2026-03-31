import { Routes, Route } from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Meet from './pages/Meet.jsx'
import Navbar from './components/Navbar.jsx'
import GuestLocationGuard from './components/GuestLocationGuard.jsx'

const App = () => {
  return(<div className='bg-linear-to-r from-black via-neutral-900 to-gray-900'>
    <div className="relative z-50">
      <Navbar/>
    </div>
      <Routes>
        <Route path="/" element={<GuestLocationGuard><Home /></GuestLocationGuard>} />
        <Route path="/login" element={<Login />} />
        <Route path="/meet" element={<Meet />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
