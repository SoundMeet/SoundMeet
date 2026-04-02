import { useState } from 'react'
import { motion } from 'framer-motion'
import { FriendsSidebar } from '../components/friends/FriendsSidebar'
import { FeedSection } from '../components/friends/FeedSection'
import { UserSearchModal } from '../components/friends/UserSearchModal'
import { useAuth } from '../injectables/Auth'

const FEED_TABS = [
  { key: 'forYou',    label: 'For you' },
  { key: 'following', label: 'Following' },
]

const Friends = () => {
  const { isLoggedIn } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [feedTab, setFeedTab] = useState('forYou')

  return (
    <div
      className="flex relative"
      style={{ height: 'calc(100vh - 64px)', background: '#111', overflow: 'hidden' }}
    >
      {/* Coming soon overlay for logged-in users */}
      {isLoggedIn && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(17,17,17,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(220,46,115,0.12)', border: '1px solid rgba(220,46,115,0.2)' }}
          >
            🎶
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-base mb-1">Friends &amp; Feed</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif' }}>
              Coming soon
            </p>
          </div>
        </div>
      )}
      {/* Left sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[280px] flex-shrink-0 h-full overflow-y-auto p-4"
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.4)',
          scrollbarWidth: 'none',
        }}
      >
        <FriendsSidebar onOpenSearch={() => setSearchOpen(true)} />
      </aside>

      {/* Main feed */}
      <main className="flex-1 h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Sticky top bar */}
        <div
          className="sticky top-0 z-10"
          style={{
            background: 'rgba(17,17,17,0.9)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Mobile: Feed title + Find People */}
          <div
            className="lg:hidden px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <h1 className="text-sm font-bold text-white">Feed</h1>
            <button
              onClick={() => setSearchOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
            >
              Find People
            </button>
          </div>

          {/* For you / Following tabs */}
          <div
            className="flex"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            {FEED_TABS.map(({ key, label }) => {
              const isActive = feedTab === key
              return (
                <button
                  key={key}
                  onClick={() => setFeedTab(key)}
                  className="flex-1 flex flex-col items-center pt-4 pb-3 gap-0 relative transition-all duration-150 hover:bg-white/[0.03] active:bg-white/[0.05]"
                  style={{ color: isActive ? '#fff' : 'rgba(229,226,225,0.35)' }}
                >
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="feed-tab-indicator"
                      className="absolute bottom-0 h-[3px] w-14 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #DC2E73, #FB4040)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Feed content */}
        <div className="max-w-[680px] mx-auto px-4 py-6">
          <FeedSection feedTab={feedTab} />
        </div>
      </main>

      <UserSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export default Friends
