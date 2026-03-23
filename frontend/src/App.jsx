import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Routes, Route, Navigate } from "react-router-dom"
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Meet from './pages/Meet.jsx'
import Register from './pages/register.jsx'

const App = () => {
  return(
    <Routes>
      {/* <Route path="/" element={<Navigate to="/" />} /> */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/meet" element={<Meet />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
