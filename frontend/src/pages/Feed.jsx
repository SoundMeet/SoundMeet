import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { MdMusicNote, MdStars } from 'react-icons/md'
import { useAuth } from '../injectables/Auth'
import { useFriends } from '../context/FriendsContext'
import { useEligibleEvents } from '../hooks/useEligibleEvents'
import { FriendsSidebar } from '../components/friends/FriendsSidebar'
import { FeedSection } from '../components/friends/FeedSection'
import { UserSearchModal } from '../components/friends/UserSearchModal'
import EventDetailModal from '../components/event-detail/EventDetailModal'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const FEED_TABS = [
  { key: 'forYou',    label: 'For you'  },
  { key: 'following', label: 'Friends'  },
]

function formatEventDate(dateTimeRaw) {
  if (!dateTimeRaw) return null
  const date = new Date(dateTimeRaw)
  if (isNaN(date.getTime())) return null

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tmrw  = new Date(today.getTime() + 86400000)
  const day   = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const time  = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (day.getTime() === today.getTime()) return `Today · ${time}`
  if (day.getTime() === tmrw.getTime())  return `Tomorrow · ${time}`
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const EVENT_TYPE_STYLE = {
  jam:  { color: '#DC2E73', bg: 'rgba(220,46,115,0.13)', label: 'Jam',  Icon: MdMusicNote },
  show: { color: '#FCD34D', bg: 'rgba(252,211,77,0.13)',  label: 'Show', Icon: MdStars     },
}

// ─── Right-rail shared shell ───────────────────────────────────────────────────

function RailModule({ title, children }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: 'rgba(229,226,225,0.32)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── Up Next module ────────────────────────────────────────────────────────────
// Shows the user's upcoming jams + shows sorted by date. Purely from existing
// useEligibleEvents data — no new API needed.

function UpNextModule({ userId }) {
  const { loading: jL, yours: yourJams, attending: goingJams }  = useEligibleEvents(userId, 'jam')
  const { loading: sL, yours: yourShows, attending: goingShows } = useEligibleEvents(userId, 'show')
  const [selected, setSelected] = useState(null)

  const loading = jL || sL

  // Merge + tag role + sort by nearest date first
  const upcoming = [
    ...yourJams.map((e)  => ({ ...e, role: 'hosting', eventType: 'jam'  })),
    ...goingJams.map((e) => ({ ...e, role: 'going',   eventType: 'jam'  })),
    ...yourShows.map((e) => ({ ...e, role: 'hosting', eventType: 'show' })),
    ...goingShows.map((e)=> ({ ...e, role: 'going',   eventType: 'show' })),
  ]
    .sort((a, b) => {
      const at = a.dateTimeRaw ? new Date(a.dateTimeRaw).getTime() : Infinity
      const bt = b.dateTimeRaw ? new Date(b.dateTimeRaw).getTime() : Infinity
      return at - bt
    })
    .slice(0, 4)

  if (loading) {
    return (
      <RailModule title="Up next">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-2.5 px-1 py-1.5 animate-pulse">
            <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-[11px] rounded" style={{ background: 'rgba(255,255,255,0.07)', width: '68%' }} />
              <div className="h-[9px] rounded"  style={{ background: 'rgba(255,255,255,0.04)', width: '45%' }} />
            </div>
          </div>
        ))}
      </RailModule>
    )
  }

  // No events → don't render the module at all (avoids empty-state noise)
  if (upcoming.length === 0) return null

  const viewerContext = (event) =>
    event.role === 'hosting' ? { isCreator: true } : { isAttendee: true }

  return (
    <>
      <RailModule title="Up next">
        <div className="flex flex-col gap-0.5">
          {upcoming.map((event) => {
            const ts = EVENT_TYPE_STYLE[event.eventType] ?? EVENT_TYPE_STYLE.jam
            const dateStr = formatEventDate(event.dateTimeRaw)
            return (
              <button
                key={`${event.eventType}-${event.id}`}
                onClick={() => setSelected(event)}
                className="flex gap-2.5 px-1 py-2 rounded-xl w-full text-left transition-colors duration-150 hover:bg-white/[0.06] active:bg-white/[0.08]"
              >
                {/* Type icon chip */}
                <div
                  className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-px"
                  style={{ background: ts.bg }}
                >
                  <ts.Icon style={{ color: ts.color, fontSize: 13 }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white truncate leading-tight">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {dateStr && (
                      <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.4)' }}>
                        {dateStr}
                      </span>
                    )}
                    <span
                      className="text-[9px] font-semibold px-1.5 py-px rounded-full"
                      style={{
                        background: event.role === 'hosting'
                          ? 'rgba(220,46,115,0.13)'
                          : 'rgba(255,255,255,0.07)',
                        color: event.role === 'hosting'
                          ? '#DC2E73'
                          : 'rgba(229,226,225,0.42)',
                      }}
                    >
                      {event.role === 'hosting' ? 'Hosting' : 'Going'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </RailModule>

      {selected && (
        <EventDetailModal
          item={selected}
          open={true}
          onClose={() => setSelected(null)}
          viewerContext={viewerContext(selected)}
        />
      )}
    </>
  )
}

// ─── Discover module ───────────────────────────────────────────────────────────
// Primary CTA for the right rail — finding musicians is the core product action.

function DiscoverModule({ onOpenSearch, friends }) {
  const [hovered, setHovered] = useState(false)
  const avatarMusicians = friends.filter((f) => f.instruments?.length > 0).slice(0, 3)
  const networkCount    = friends.length

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col gap-4 p-4 cursor-pointer transition-all duration-200"
      style={{
        background: hovered ? 'rgba(220,46,115,0.09)' : 'rgba(220,46,115,0.04)',
        border:     hovered ? '1px solid rgba(220,46,115,0.38)' : '1px solid rgba(220,46,115,0.2)',
        boxShadow:  hovered
          ? '0 8px 32px rgba(220,46,115,0.14), 0 0 0 1px rgba(220,46,115,0.06)'
          : '0 2px 16px rgba(0,0,0,0.18)',
        transform:  hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={onOpenSearch}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label="Find musicians"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenSearch() } }}
    >
      {/* Decorative ambient glow — bottom-right corner */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          bottom:        -36,
          right:         -28,
          width:         110,
          height:        110,
          borderRadius:  '50%',
          background:    'rgba(220,46,115,0.22)',
          filter:        'blur(48px)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon + title row */}
      <div className="relative flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-px"
          style={{ background: 'rgba(220,46,115,0.18)', color: '#DC2E73' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold leading-tight" style={{ color: '#E5E2E1' }}>
            Discover Musicians
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(229,226,225,0.46)' }}>
            Find players by instrument, genre, or location
          </p>
        </div>
      </div>

      {/* Network context — avatar cluster + count */}
      {networkCount > 0 && (
        <div className="relative flex items-center gap-2">
          {avatarMusicians.length > 0 && (
            <div className="flex -space-x-1.5 flex-shrink-0">
              {avatarMusicians.map((f) => (
                f.avatarUrl ? (
                  <img
                    key={f.id}
                    src={f.avatarUrl}
                    alt={f.displayName}
                    className="w-5 h-5 rounded-full object-cover"
                    style={{ boxShadow: '0 0 0 1.5px rgba(15,15,15,0.85)' }}
                  />
                ) : (
                  <div
                    key={f.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #DC2E73, #c02460)', boxShadow: '0 0 0 1.5px rgba(15,15,15,0.85)' }}
                  >
                    {f.displayName?.[0]?.toUpperCase()}
                  </div>
                )
              ))}
            </div>
          )}
          <p className="text-[10px]" style={{ color: 'rgba(229,226,225,0.38)' }}>
            {networkCount} musician{networkCount !== 1 ? 's' : ''} in your network
          </p>
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenSearch() }}
        className="relative w-full flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
        style={{
          height:    44,
          background: 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)',
          boxShadow: hovered
            ? '0 4px 24px rgba(220,46,115,0.5), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 16px rgba(220,46,115,0.28)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        Find Musicians
      </button>
    </div>
  )
}

// ─── Right rail ────────────────────────────────────────────────────────────────
// Left  = who you know (relationships)
// Right = what to do next (discovery first, then upcoming activity)

function FeedRightRail({ onOpenSearch }) {
  const { user }    = useAuth()
  const { friends } = useFriends()

  return (
    <div className="flex flex-col gap-4">
      <DiscoverModule onOpenSearch={onOpenSearch} friends={friends} />
      <UpNextModule userId={user?.id} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Friends = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [feedTab,    setFeedTab]    = useState('forYou')

  // Lock body scroll so iOS Safari can't scroll the window and push tabs into the navbar
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="flex relative"
      style={{ height: 'calc(100dvh - 64px)', overflow: 'hidden', overscrollBehavior: 'none' }}
    >
      <Helmet>
        <title>Feed</title>
        <meta name="description" content="See what your friends and local musicians are up to on SoundMeet — new jams, upcoming shows, and posts from the community." />
      </Helmet>
      {/* Left sidebar — relationships / social rail */}
      <aside
        className="hidden lg:flex flex-col w-[260px] xl:w-[300px] flex-shrink-0 h-full overflow-y-auto p-4 xl:p-5"
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.4)',
          scrollbarWidth: 'none',
        }}
      >
        <FriendsSidebar />
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Tab bar */}
        <div className="flex-shrink-0">

          {/* For you / Friends tabs */}
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
                  className="flex-1 flex flex-col items-center pt-5 pb-4 sm:pt-4 sm:pb-3 relative transition-all duration-150 hover:bg-white/[0.03] active:bg-white/[0.05]"
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

        {/* Scrollable feed + right rail */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="max-w-[1080px] mx-auto px-4 py-6">
            <div className="flex gap-6 items-start">

              {/* Center — creation + filtering + feed */}
              <div className="flex-1 min-w-0">
                <FeedSection feedTab={feedTab} />
              </div>

              {/* Right rail — discovery + upcoming activity (xl+) */}
              <aside className="hidden xl:block w-[256px] flex-shrink-0">
                <div className="sticky top-6">
                  <FeedRightRail onOpenSearch={() => setSearchOpen(true)} />
                </div>
              </aside>

            </div>
          </div>
        </div>
      </main>

      <UserSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export default Friends
