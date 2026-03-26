/**
 * LoginForm
 *
 * Calls login(credentials) from the real AuthProvider.
 * Fields match the backend endpoint: POST /api-token-auth/
 *   Body: { username, password }
 */
import { useState } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'

export default function LoginForm() {
  const { login } = useAuth()
  const { closeModal, switchView } = useAuthModal()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form)
      closeModal()
    } catch (err) {
      setError(
        err?.non_field_errors?.[0] ??
          err?.detail ??
          'Invalid username or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {/* Google placeholder — no functionality */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 hover:bg-white/[0.09] focus:outline-none focus-visible:ring-1"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.72)',
          fontFamily: 'Sora, sans-serif',
        }}
      >
        <FaGoogle className="text-sm opacity-70" />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />
        <span
          className="text-xs select-none"
          style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}
        >
          or
        </span>
        <div
          className="flex-1"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Error */}
      {error && (
        <p
          className="text-xs px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(251,64,64,0.1)',
            color: '#fb4040',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {error}
        </p>
      )}

      {/* Fields */}
      <input
        className="jam-input"
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        required
        autoComplete="username"
      />
      <input
        className="jam-input"
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        autoComplete="current-password"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 mt-0.5 focus:outline-none focus-visible:ring-2"
        style={{
          background: loading ? 'rgba(220,46,115,0.5)' : '#DC2E73',
          color: '#fff',
          fontFamily: 'Sora, sans-serif',
          opacity: loading ? 0.75 : 1,
          boxShadow: loading ? 'none' : '0 0 20px rgba(220,46,115,0.25)',
        }}
      >
        {loading ? 'Signing in…' : 'Log in'}
      </button>

      {/* Switch to signup */}
      <p
        className="text-center text-xs"
        style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Sora, sans-serif' }}
      >
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => switchView('signup')}
          className="font-semibold underline underline-offset-2 focus:outline-none"
          style={{ color: '#DC2E73' }}
        >
          Sign up
        </button>
      </p>
    </form>
  )
}
