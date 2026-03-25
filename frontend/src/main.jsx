import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import NavState from './context/NavState.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <NavState>
      <StrictMode>
        <App />
      </StrictMode>
    </NavState>
  </BrowserRouter>,
)
