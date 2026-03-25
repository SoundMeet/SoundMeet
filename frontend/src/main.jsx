import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
<<<<<<< HEAD
import { AuthProvider } from './injectables/Auth.jsx'
import { BrowserRouter } from 'react-router-dom'
import NavState from './context/NavState.jsx'
=======
import { BrowserRouter } from 'react-router-dom'
import NavState from './context/navState.jsx'
>>>>>>> e64aeeb (Use Logo.svg as favicon)

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <NavState>
      <StrictMode>
<<<<<<< HEAD
        <AuthProvider>
          <App />
        </AuthProvider>
=======
        <App />
>>>>>>> e64aeeb (Use Logo.svg as favicon)
      </StrictMode>
    </NavState>
  </BrowserRouter>,
)
