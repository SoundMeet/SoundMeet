import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './injectables/Auth.jsx'
import { BrowserRouter } from 'react-router-dom'
import NavState from './context/NavState.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId="939667629017-610lhvjmsm6vhi8olriig4sp7gurk2nh.apps.googleusercontent.com">
      <NavState>
        <StrictMode>
          <AuthProvider>
            <App />
          </AuthProvider>
        </StrictMode>
      </NavState>
    </GoogleOAuthProvider>
  </BrowserRouter>,
)