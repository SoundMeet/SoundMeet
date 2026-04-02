import { useState, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { MdSearch, MdClose } from 'react-icons/md'
import { useFriends } from '../../context/FriendsContext'
import { UserSearchResult } from './UserSearchResult'

function useDebounce(fn, delay) {
  let timer
  return useCallback((...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export function UserSearchModal({ open, onOpenChange }) {
  const { allUsers } = useFriends()
  const [query, setQuery] = useState('')
  const [displayQuery, setDisplayQuery] = useState('')

  const handleChange = (e) => {
    const val = e.target.value
    setDisplayQuery(val)
    // Simple inline debounce via state
    setQuery(val)
  }

  const filtered = query.trim()
    ? allUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.instruments.some((i) => i.toLowerCase().includes(query.toLowerCase())) ||
          u.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()))
      )
    : allUsers

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{
            background: 'radial-gradient(ellipse at 50% 35%, rgba(220,46,115,0.07) 0%, rgba(0,0,0,0.75) 100%)',
          }}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
          style={{ pointerEvents: 'none' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-[540px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              pointerEvents: 'auto',
              background: 'rgba(18,18,18,0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(220,46,115,0.06)',
              maxHeight: '80vh',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Dialog.Title className="text-base font-bold text-white">
                Find People
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.5)' }}
                >
                  <MdClose className="text-base" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search input */}
            <div className="px-5 py-3 flex-shrink-0">
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <MdSearch className="text-lg flex-shrink-0" style={{ color: 'rgba(229,226,225,0.35)' }} />
                <input
                  type="text"
                  value={displayQuery}
                  onChange={handleChange}
                  placeholder="Search by name, instrument, or genre…"
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white placeholder-transparent outline-none"
                  style={{ caretColor: '#DC2E73' }}
                />
                <style>{`input::placeholder { color: rgba(229,226,225,0.3); }`}</style>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm" style={{ color: 'rgba(229,226,225,0.35)' }}>
                    No musicians found for "{displayQuery}"
                  </p>
                </div>
              ) : (
                <div>
                  {!query.trim() && (
                    <p
                      className="px-5 pb-1 text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(229,226,225,0.25)' }}
                    >
                      Musicians near you
                    </p>
                  )}
                  {filtered.map((user) => (
                    <UserSearchResult key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
