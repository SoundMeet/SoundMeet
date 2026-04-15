import { useAuth } from '../injectables/Auth.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'

export function useRequireAuth() {
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  // Returns a wrapped version of fn that first checks auth.
  // If the user is not logged in, opens the login modal instead.
  const requireAuth = (fn) => (...args) => {
    if (!user) { openModal('login'); return }
    return fn(...args)
  }

  return requireAuth
}
