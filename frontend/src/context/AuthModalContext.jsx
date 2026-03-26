/**
 * AuthModalContext
 *
 * Controls the global auth modal (Login / Sign Up).
 * Use openModal() from anywhere in the tree to show the modal.
 *
 * Usage:
 *   const { openModal } = useAuthModal()
 *   openModal('login')   // or 'signup'
 */
import { createContext, useContext, useState } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState('login') // 'login' | 'signup'

  const openModal = (v = 'login') => {
    setView(v)
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  const switchView = (v) => setView(v)

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openModal, closeModal, switchView }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  return ctx
}
