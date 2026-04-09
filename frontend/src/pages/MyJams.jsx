import { useState, useEffect, useCallback } from 'react'
import EventDetailModal from '../components/event-detail/EventDetailModal'
import CreateJamModal from '../components/create-jam/CreateJamModal'
import JoinJamModal from '../components/join-jam/JoinJamModal'
import {
  getDiscoveryAccentColor,
  matchesDiscoverySearch,
  hexToRgba,
  DISCOVERY_VARIANTS,
} from '../utils/discovery'

const BROWSE_SECTIONS = [
  { key: 'all',  title: 'Near You',          filter: () => true },
  { key: 'jam',  title: 'Jams',              filter: (i) => i.type === 'jam' },
  { key: 'show', title: 'Shows',             filter: (i) => i.type === 'promote_show' },
  { key: 'fb',   title: 'Bandmate Requests', filter: (i) => i.type === 'find_bandmate' },
  { key: 'jb',   title: 'Join a Band',       filter: (i) => i.type === 'join_band' },
]

import { jamService } from '../injectables/jamService'
import { useAuth } from '../injectables/Auth'

// ─────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────

// Centered content container — all main content lives inside this
function ContentWrap({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const variant = DISCOVERY_VARIANTS[type] ?? DISCOVERY_VARIANTS.jam
  const color = variant.accentColor
  return (
    <span
      className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
      style={{ color, background: hexToRgba(color, 0.14) }}
    >
      {variant.label}
    </span>
  )
}

// Section heading — parent handles horizontal padding
function SectionHeading({ title, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="h-3.5 w-0.5 bg-[#DC2E73] rounded-full shrink-0" />
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {count != null && (
        <span className="text-xs text-neutral-600">{count}</span>
      )}
    </div>
  )
}

// Browse card — used in both horizontal rail and responsive grid
function ActivityCard({ item, onOpen, inGrid = false }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  const dateLine = item.dateTime ?? item.metaSecondary ?? item.date
  return (
    <button
      onClick={() => onOpen(item)}
      className={`snap-start rounded-2xl border border-white/[0.07] bg-neutral-800/50 p-4 text-left transition-all duration-200 hover:border-white/[0.18] hover:bg-neutral-800/80 hover:scale-[1.02] transform-gpu ${
        inGrid
          ? 'w-full'
          : 'flex-none min-w-[260px] sm:min-w-[280px] lg:min-w-[300px]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold"
          style={{ background: hexToRgba(color, 0.14), color }}
        >
          {glyph}
        </div>
        <TypeBadge type={item.type} />
        {item.badgeLabel && (
          <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wide">
            {item.badgeLabel}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-white mb-1 leading-snug line-clamp-2">{item.title}</h3>
      <p className="text-[11px] text-neutral-500 mb-1.5">{item.subtitle}</p>
      {dateLine && <p className="text-[11px] text-neutral-600">{dateLine}</p>}
    </button>
  )
}

// Featured card — Jams I'm Going carousel
function FeaturedCard({ item, isActive, dataIndex, onOpen, onMouseEnter, onMouseLeave }) {
  const color = getDiscoveryAccentColor(item)
  return (
    <div
      data-going-index={dataIndex}
      onClick={() => onOpen(item)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`snap-center flex-none rounded-2xl border cursor-pointer transition-all duration-300 ease-out transform-gpu ${
        isActive ? 'z-10' : 'opacity-60'
      }`}
      style={{
        width: isActive ? 'clamp(280px, 34vw, 390px)' : 'clamp(240px, 28vw, 320px)',
        height: isActive ? 'clamp(220px, 27vh, 256px)' : 'clamp(200px, 25vh, 236px)',
        borderColor: isActive ? hexToRgba(color, 0.28) : 'rgba(255,255,255,0.06)',
        background: isActive
          ? `linear-gradient(135deg, ${hexToRgba(color, 0.09)} 0%, rgba(18,18,18,0.98) 100%)`
          : 'rgba(28,28,32,0.75)',
        boxShadow: isActive ? `0 8px 40px ${hexToRgba(color, 0.10)}` : 'none',
        transform: isActive ? 'scale(1.04)' : 'scale(0.96)',
      }}
    >
      <div className="p-5 h-full flex flex-col justify-between">
        <div>
          <TypeBadge type={item.type} />
          <h2
            className="font-bold text-white leading-tight mt-2 mb-1.5 transition-all duration-300"
            style={{ fontSize: isActive ? '1.2rem' : '1rem' }}
          >
            {item.title}
          </h2>
          <p className="text-neutral-400 text-sm">{item.date}</p>
          {item.location && <p className="text-neutral-600 text-xs mt-0.5">{item.location}</p>}
        </div>
        <div>
          {item.description && (
            <p className="text-neutral-300 text-xs line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="-ml-2 first:ml-0 h-6 w-6 rounded-full bg-neutral-600 border-2 border-neutral-900 flex items-center justify-center text-[9px] font-semibold"
                >
                  U{i}
                </div>
              ))}
              {item.attendeeCount != null && (
                <span className="ml-2 text-[11px] text-neutral-500">{item.attendeeCount} going</span>
              )}
            </div>
            {isActive && (
              <span className="text-[11px] font-semibold" style={{ color }}>
                View →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Archive card — Past Jams grid
function ArchiveCard({ item, onOpen }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  return (
    <button
      onClick={() => onOpen(item)}
      className="w-full rounded-xl border border-white/[0.06] bg-neutral-800/40 p-4 text-left hover:border-white/[0.12] hover:bg-neutral-800/60 transition-all duration-200 hover:scale-[1.01] transform-gpu"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: hexToRgba(color, 0.12), color }}
        >
          {glyph}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-white leading-tight">{item.title}</h3>
            <span className="text-[10px] text-neutral-600 shrink-0">{item.date}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={item.type} />
            {item.rating != null && (
              <span className="text-[11px]" style={{ color }}>
                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
              </span>
            )}
            {item.attendeeCount && (
              <span className="text-[11px] text-neutral-500">{item.attendeeCount} attended</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// Management row — Created Jams list
function ManageRow({ item, onOpen, onEdit }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  return (
    <div
      onClick={() => onOpen(item)}
      className="group flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-white/[0.025]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: hexToRgba(color, 0.12), color }}
        >
          {glyph}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
            <TypeBadge type={item.type} />
          </div>
          <p className="text-[11px] text-neutral-500">
            {[item.date, item.location].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {item.canEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(item) }}
          className="shrink-0 text-xs font-medium text-neutral-500 border border-white/10 rounded-full px-3 py-1 transition-all duration-150 group-hover:text-[#DC2E73] group-hover:border-[#DC2E73]/30"
        >
          Edit
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Browse section — Near You = rail, typed sections = grid
// ─────────────────────────────────────────────────────────────

function BrowseSection({ section, items, onOpen }) {
  const isRail = section.key === 'all'
  return (
    <div>
      <ContentWrap>
        <SectionHeading title={section.title} count={items.length} />
      </ContentWrap>

      {isRail ? (
        // Horizontal scrollable rail — bleeds to container edges
        <ContentWrap className="!px-0">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-3 px-4 sm:px-6 lg:px-8 pb-2 snap-x snap-mandatory">
              {items.map((item) => (
                <ActivityCard key={item.id} item={item} onOpen={onOpen} inGrid={false} />
              ))}
            </div>
          </div>
        </ContentWrap>
      ) : (
        // Responsive grid — 1→2→3→4 columns, capped at max-width
        <ContentWrap>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ActivityCard key={item.id} item={item} onOpen={onOpen} inGrid={true} />
            ))}
          </div>
        </ContentWrap>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

const TABS = ['Browse', "Jams I'm Going", 'Past Jams', 'Created Jams']

const MyJams = () => {
  const { user, isLoggedIn } = useAuth()
  const [activeTab, setActiveTab] = useState('Browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGoingCard, setActiveGoingCard] = useState(0)
  const [hoveredGoingCard, setHoveredGoingCard] = useState(null)

  // Modal state — one canonical EventDetailModal for all entity types
  // openedFrom tracks which tab launched the modal so viewerContext is accurate.
  const [discoveryModal, setDiscoveryModal] = useState({ open: false, item: null, openedFrom: null })
  const [editingJam, setEditingJam] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinJamModal, setJoinJamModal] = useState({ open: false, jam: null })

  // ── Real data from Supabase ───────────────────────────────────────────────
  const [browseItems, setBrowseItems]     = useState([])
  const [upcomingItems, setUpcomingItems] = useState([])
  const [pastItems, setPastItems]         = useState([])
  const [createdItems, setCreatedItems]   = useState([])
  const [tabLoading, setTabLoading]       = useState(false)

  const loadTab = useCallback(async (tab) => {
    if (!isLoggedIn || !user?.id) return
    setTabLoading(true)
    try {
      if (tab === 'Browse') {
        const items = await jamService.getDiscoverFeed()
        setBrowseItems(items)
      } else if (tab === "Jams I'm Going") {
        const items = await jamService.getMyAttendingJams(user.id)
        setUpcomingItems(items)
      } else if (tab === 'Past Jams') {
        const items = await jamService.getMyPastJams(user.id)
        setPastItems(items)
      } else if (tab === 'Created Jams') {
        const items = await jamService.getMyCreatedJams(user.id)
        setCreatedItems(items)
      }
    } catch (err) {
      console.error('[MyJams] Failed to load tab:', tab, err)
    } finally {
      setTabLoading(false)
    }
  }, [isLoggedIn, user?.id])

  // Load Browse tab on mount; reload any tab when it becomes active
  useEffect(() => { loadTab(activeTab) }, [activeTab, loadTab])

  // ── Modal dispatch ────────────────────────────────────────
  const openItem = (item) => setDiscoveryModal({ open: true, item, openedFrom: activeTab })

  // Derive viewerContext from which tab launched the modal
  const getViewerContext = (tab, item) => {
    if (tab === 'Created Jams') return { isCreator: item?.canEdit ?? true }
    if (tab === "Jams I'm Going") return { isAttendee: true }
    if (tab === 'Past Jams') return { isAttendee: true, isPastEvent: true }
    return {}
  }

  const editInitialValues = editingJam ? {
    title: editingJam.title ?? '',
    description: editingJam.description ?? '',
    isPrivate: editingJam.isPrivate ?? false,
    maxParticipants: editingJam.maxParticipants != null ? String(editingJam.maxParticipants) : '',
    locationQuery: editingJam.locationName ?? editingJam.location ?? editingJam.subtitle ?? '',
  } : undefined

  // ── Search filter ─────────────────────────────────────────
  const filtered = (items) =>
    searchQuery.trim() ? items.filter((i) => matchesDiscoverySearch(i, searchQuery)) : items

  // ── Going carousel scroll ─────────────────────────────────
  const handleGoingCarouselScroll = (e) => {
    const container = e.currentTarget
    const cards = Array.from(container.querySelectorAll('[data-going-index]'))
    if (!cards.length) return
    const center = container.scrollLeft + container.clientWidth / 2
    let nextActive = 0
    let closest = Infinity
    cards.forEach((card) => {
      const idx = Number(card.getAttribute('data-going-index'))
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (dist < closest) { closest = dist; nextActive = idx }
    })
    setActiveGoingCard((prev) => (prev === nextActive ? prev : nextActive))
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] text-white flex flex-col relative overflow-hidden">

      {/* ── Tab bar ── */}
      <div className="border-b border-white/[0.06] shrink-0">
        <ContentWrap className="!px-0 flex items-center">
          {/* Tabs — horizontally scrollable on small screens */}
          <div className="flex overflow-x-auto scrollbar-none flex-1 min-w-0 px-4 sm:px-6 lg:px-8">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery('') }}
                className={`relative shrink-0 px-4 py-4 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#DC2E73] rounded-full" />
                )}
              </button>
            ))}
          </div>
          {/* Search — always visible, right side */}
          <div className="shrink-0 pr-4 sm:pr-6 lg:pr-8 pl-2">
            <div className="flex items-center gap-2 bg-neutral-800/60 border border-white/[0.08] rounded-full px-3 py-1.5">
              <i className="fa-solid fa-magnifying-glass text-neutral-500 text-[11px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                aria-label="Search"
                className="bg-transparent text-xs text-white placeholder:text-neutral-600 focus:outline-none w-20 sm:w-28"
              />
            </div>
          </div>
        </ContentWrap>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* Shared loading state */}
        {tabLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Browse */}
        {activeTab === 'Browse' && (
          <div className="h-full overflow-y-auto">
            <div className="py-6 pb-24 space-y-8">
              {!tabLoading && browseItems.length === 0 ? (
                <ContentWrap className="pt-10 flex flex-col items-center gap-2">
                  <p className="text-sm text-neutral-400">No jams found yet.</p>
                  <p className="text-xs text-neutral-600">Create one to get started!</p>
                </ContentWrap>
              ) : BROWSE_SECTIONS.map((section) => {
                const items = filtered(browseItems).filter(section.filter)
                if (!items.length) return null
                return (
                  <BrowseSection
                    key={section.key}
                    section={section}
                    items={items}
                    onOpen={openItem}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Jams I'm Going */}
        {activeTab === "Jams I'm Going" && (
          <div className="h-full flex flex-col">
            <ContentWrap className="pt-6 pb-3 shrink-0">
              <h2 className="text-xl font-bold text-white">Upcoming</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Jams, shows, and sessions you're participating in
              </p>
            </ContentWrap>
            {filtered(upcomingItems).length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-neutral-600">
                  No upcoming items{searchQuery ? ' matching your search' : ''}.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex items-center">
                <div className="w-full overflow-x-auto" onScroll={handleGoingCarouselScroll}>
                  <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-6 snap-x snap-mandatory mx-auto max-w-[1500px]">
                    {filtered(upcomingItems).map((item, idx) => {
                      const isActive = hoveredGoingCard !== null
                        ? hoveredGoingCard === idx
                        : activeGoingCard === idx
                      return (
                        <FeaturedCard
                          key={item.id}
                          item={item}
                          isActive={isActive}
                          dataIndex={idx}
                          onOpen={openItem}
                          onMouseEnter={() => setHoveredGoingCard(idx)}
                          onMouseLeave={() => setHoveredGoingCard(null)}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Jams */}
        {activeTab === 'Past Jams' && (
          <div className="h-full overflow-y-auto">
            <ContentWrap className="py-6 pb-24">
              <h2 className="text-xl font-bold text-white mb-0.5">Past Activity</h2>
              <p className="text-sm text-neutral-500 mb-6">Your jam, show, and session history</p>
              {filtered(pastItems).length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No past items{searchQuery ? ' matching your search' : ''}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered(pastItems).map((item) => (
                    <ArchiveCard key={item.id} item={item} onOpen={openItem} />
                  ))}
                </div>
              )}
            </ContentWrap>
          </div>
        )}

        {/* Created Jams */}
        {activeTab === 'Created Jams' && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
              <h2 className="text-xl font-bold text-white mb-0.5">Created</h2>
              <p className="text-sm text-neutral-500 mb-6">Jams, shows, and posts you manage</p>
              {filtered(createdItems).length === 0 ? (
                <p className="text-sm text-neutral-600">
                  No created items{searchQuery ? ' matching your search' : ''}.
                </p>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-neutral-900/50 overflow-hidden">
                  {filtered(createdItems).map((item) => (
                    <ManageRow
                      key={item.id}
                      item={item}
                      onOpen={openItem}
                      onEdit={(item) => { setEditingJam(item); setCreateOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Create button ── */}
      <div className="absolute bottom-5 right-4 sm:bottom-6 sm:right-6 lg:right-8 z-10">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-[#DC2E73] hover:bg-[#c4265a] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-[#DC2E73]/20 transition-all duration-200 hover:shadow-[#DC2E73]/35 hover:scale-[1.02] transform-gpu"
        >
          <span className="text-base leading-none">+</span>
          Create Jam
        </button>
      </div>

      {/* ── Modals ── */}

      {/* Canonical entity modal — all types: jam, promote_show, join_band, find_bandmate */}
      <EventDetailModal
        item={discoveryModal.item}
        open={discoveryModal.open}
        onClose={() => setDiscoveryModal({ open: false, item: null, openedFrom: null })}
        viewerContext={getViewerContext(discoveryModal.openedFrom, discoveryModal.item)}
        openedFrom="my-jams"
        onJoin={() => {
          const item = discoveryModal.item
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          if (item?.type === 'jam') {
            setJoinJamModal({
              open: true,
              jam: {
                id: item.id,
                title: item.title,
                isPrivate: !!item.isPrivate,
                dateTime: item.dateTime ?? item.metaSecondary ?? null,
                locationLabel: item.locationName ?? item.subtitle ?? null,
              },
            })
          }
        }}
        onEdit={(item) => {
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          setEditingJam(item)
          setCreateOpen(true)
        }}
        onDelete={async (item) => {
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          try {
            await jamService.deleteJam(item.id)
            setCreatedItems((prev) => prev.filter((j) => j.id !== String(item.id)))
          } catch (err) {
            console.error('Delete jam failed:', err)
          }
        }}
        onRate={(item, rating, comment) => {
          // Optimistically update the rating on the archive card
          setPastItems((prev) =>
            prev.map((p) => p.id === item.id ? { ...p, rating } : p)
          )
          // Keep the open modal in sync so footer label flips to "Edit Review"
          setDiscoveryModal((prev) =>
            prev.item?.id === item.id
              ? { ...prev, item: { ...prev.item, rating } }
              : prev
          )
          console.log("Rate jam:", item.id, rating, comment)
          // TODO: await api.rateJam(item.id, { rating, comment })
        }}
      />

      <JoinJamModal
        isOpen={joinJamModal.open}
        onClose={() => setJoinJamModal({ open: false, jam: null })}
        jam={joinJamModal.jam}
      />

      {/* Create/edit jam modal */}
      <CreateJamModal
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) { setEditingJam(null); loadTab(activeTab) } }}
        initialValues={editInitialValues}
      />

    </div>
  )
}

export default MyJams
