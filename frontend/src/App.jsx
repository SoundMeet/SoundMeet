import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Meet from './pages/Meet.jsx'
import Navbar from './components/Navbar.jsx'

const App = () => {
  return(<div className='bg-gradient-to-r from-black via-neutral-900 to-gray-900'>
    <Navbar/>
      <Routes>
        {/* <Route path="/" element={<Navigate to="/" />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/meet" element={<Meet />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
