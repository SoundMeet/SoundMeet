import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Settings, ChevronLeft, Volume2, VolumeX, BellOff,
  UserPlus, UserCheck, Heart, MessageCircle, Music, Smartphone,
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { NotificationItem } from './NotificationItem'

// ─── Grouping ─────────────────────────────────────────────────────────────────

const GROUPABLE = new Set(['post_like'])

function groupNotifications(notifications) {
  const buckets = new Map()
  const ordered = []

  for (const n of notifications) {
    if (!GROUPABLE.has(n.type) || !n.referenceId) {
      ordered.push(n)
      continue
    }
    const key = `${n.type}::${n.referenceId}`
    if (buckets.has(key)) {
      const g = buckets.get(key)
      g._members.push(n)
      g._count = g._members.length
      if (!n.isRead) g.isRead = false
    } else {
      const g = { ...n, id: `group::${key}`, _group: true, _members: [{ ...n }], _count: 1 }
      buckets.set(key, g)
      ordered.push(g)
    }
  }
  return ordered
}

// ─── Settings panel types ─────────────────────────────────────────────────────

const PREF_TYPES = [
  { type: 'friend_request',          label: 'Friend requests',    Icon: UserPlus     },
  { type: 'friend_request_accepted', label: 'Friend acceptances', Icon: UserCheck    },
  { type: 'post_like',               label: 'Post likes',          Icon: Heart        },
  { type: 'post_comment',            label: 'Post comments',       Icon: MessageCircle },
  { type: 'jam_invite',              label: 'Jam invites',         Icon: Music        },
]

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className="relative inline-flex w-8 h-[18px] rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: enabled && !disabled ? '#DC2E73' : 'rgba(255,255,255,0.12)' }}
    >
      <span
        className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(14px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ onBack, mutedTypes, soundEnabled, toggleMuteType, toggleSound, pushPermission, pushEnabled, togglePush }) {
  const pushBlocked     = pushPermission === 'denied'
  const pushUnsupported = pushPermission === 'unsupported'
  const pushActive      = pushEnabled && pushPermission === 'granted'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] focus:outline-none"
          aria-label="Back to notifications"
        >
          <ChevronLeft size={15} style={{ color: 'rgba(229,226,225,0.45)' }} />
        </button>
        <span className="text-[13px] font-semibold" style={{ color: 'rgba(229,226,225,0.8)' }}>
          Notification settings
        </span>
      </div>

      {/* Browser push */}
      {!pushUnsupported && (
        <>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3"
              style={{ color: 'rgba(229,226,225,0.22)' }}>
              Browser
            </p>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <Smartphone size={13} className="mt-0.5 flex-shrink-0"
                  style={{ color: pushActive ? 'rgba(229,226,225,0.45)' : 'rgba(229,226,225,0.2)' }} />
                <div>
                  <span className="text-[13px]" style={{ color: 'rgba(229,226,225,0.68)' }}>
                    Push notifications
                  </span>
                  {pushBlocked && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(220,46,115,0.6)' }}>
                      Blocked — allow in browser site settings
                    </p>
                  )}
                  {pushPermission === 'default' && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.25)' }}>
                      Toggle to request permission
                    </p>
                  )}
                </div>
              </div>
              <Toggle enabled={pushActive} onChange={togglePush} label="Push notifications" disabled={pushBlocked} />
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
        </>
      )}

      {/* Sound */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: 'rgba(229,226,225,0.22)' }}>
          Sound
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {soundEnabled
              ? <Volume2 size={13} style={{ color: 'rgba(229,226,225,0.45)' }} />
              : <VolumeX  size={13} style={{ color: 'rgba(229,226,225,0.22)' }} />}
            <span className="text-[13px]" style={{ color: 'rgba(229,226,225,0.68)' }}>
              Play chime on new notification
            </span>
          </div>
          <Toggle enabled={soundEnabled} onChange={toggleSound} label="Notification sound" />
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

      {/* Per-type muting */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: 'rgba(229,226,225,0.22)' }}>
          Show in notifications
        </p>
        <div className="flex flex-col gap-0">
          {PREF_TYPES.map(({ type, label, Icon }) => {
            const enabled = !mutedTypes.includes(type)
            return (
              <div key={type} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Icon size={13} style={{ color: enabled ? 'rgba(229,226,225,0.45)' : 'rgba(229,226,225,0.15)' }} />
                  <span className="text-[13px] transition-colors"
                    style={{ color: enabled ? 'rgba(229,226,225,0.68)' : 'rgba(229,226,225,0.25)' }}>
                    {label}
                  </span>
                </div>
                <Toggle enabled={enabled} onChange={() => toggleMuteType(type)} label={`Toggle ${label}`} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-3 flex-shrink-0" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  const isRequests = tab === 'requests'
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {isRequests
          ? <UserPlus size={16} style={{ color: 'rgba(229,226,225,0.25)' }} />
          : <BellOff  size={16} style={{ color: 'rgba(229,226,225,0.25)' }} />
        }
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(229,226,225,0.4)' }}>
          {isRequests ? 'No pending requests' : 'All caught up'}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.2)' }}>
          {isRequests
            ? 'Friend requests will appear here'
            : 'Your activity will show up here'}
        </p>
      </div>
    </div>
  )
}

// ─── Main dropdown ────────────────────────────────────────────────────────────

export function NotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    friendRequests,
    newNotifIds,
    hasMore,
    loadingMore,
    loadMore,
    mutedTypes,
    soundEnabled,
    toggleMuteType,
    toggleSound,
    pushPermission,
    pushEnabled,
    togglePush,
    markVisibleRead,
    markAllRead,
  } = useNotifications()

  const [open,         setOpen]         = useState(false)
  const [activeTab,    setActiveTab]    = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const containerRef = useRef(null)
  const location     = useLocation()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on route change
  useEffect(() => { setOpen(false) }, [location.pathname, location.search])

  // Auto mark-read 2s after panel opens
  useEffect(() => {
    if (!open) return
    const source = activeTab === 'requests' ? friendRequests : notifications
    const unreadIds = source
      .filter((n) => !n.isRead && !mutedTypes.includes(n.type))
      .map((n) => n.id)
    if (!unreadIds.length) return
    const timer = setTimeout(() => markVisibleRead(unreadIds), 2000)
    return () => clearTimeout(timer)
  }, [open, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter + group
  const rawDisplayed =
    activeTab === 'requests'
      ? friendRequests
      : notifications.filter((n) => !mutedTypes.includes(n.type))

  const displayedNotifs = groupNotifications(rawDisplayed)

  // Tab counts
  const allUnread    = notifications.filter((n) => !n.isRead && !mutedTypes.includes(n.type)).length
  const requestCount = friendRequests.length

  const TABS = [
    { key: 'all',      label: 'All',      count: allUnread    },
    { key: 'requests', label: 'Requests', count: requestCount },
  ]

  return (
    <div ref={containerRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded-lg"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell
          size={20}
          className="transition-opacity"
          style={{ color: 'rgba(255,255,255,0.88)', opacity: open ? 1 : undefined }}
        />
        {unreadCount > 0 && (
          <span
            className="absolute -top-[3px] -right-[3px] min-w-[15px] h-[15px] px-[3px] rounded-full flex items-center justify-center text-[8.5px] font-bold text-white"
            style={{ background: '#DC2E73', lineHeight: 1 }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y:  0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="fixed md:absolute right-2 md:right-0 top-16 md:top-full md:mt-3 z-[200] w-[380px] max-w-[calc(100vw-16px)] md:max-w-[380px] flex flex-col rounded-2xl overflow-hidden" style={{
              background:           'rgba(13,13,13,0.98)',
              backdropFilter:       'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border:               '1px solid rgba(255,255,255,0.07)',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(220,46,115,0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
              maxHeight:       'min(560px, calc(100dvh - 80px))',
              transformOrigin: 'top right',
            }}
          >
            {showSettings ? (
              <SettingsPanel
                onBack={() => setShowSettings(false)}
                mutedTypes={mutedTypes}
                soundEnabled={soundEnabled}
                toggleMuteType={toggleMuteType}
                toggleSound={toggleSound}
                pushPermission={pushPermission}
                pushEnabled={pushEnabled}
                togglePush={togglePush}
              />
            ) : (
              <>
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0">
                  <div>
                    <h2
                      className="text-[15px] font-bold tracking-tight leading-tight"
                      style={{ color: 'rgba(255,255,255,0.92)' }}
                    >
                      Notifications
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.28)' }}>
                      Activity and requests
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 mt-0.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="px-2.5 py-2.5 md:py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-white/[0.05] focus:outline-none"
                        style={{ color: 'rgba(220,46,115,0.8)' }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="w-11 h-11 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] focus:outline-none"
                      aria-label="Notification settings"
                    >
                      <Settings size={14} style={{ color: 'rgba(229,226,225,0.3)' }} />
                    </button>
                  </div>
                </div>

                {/* ── Tabs ───────────────────────────────────────────────── */}
                <div className="px-5 pb-4 flex-shrink-0">
                  <div
                    className="flex rounded-xl p-[3px] gap-[3px]"
                    role="tablist"
                    aria-label="Filter notifications"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveTab(tab.key)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-[5px] rounded-[9px] text-[12px] font-semibold transition-all duration-200 focus:outline-none"
                          style={{
                            background: isActive ? 'rgba(220,46,115,0.14)' : 'transparent',
                            color: isActive ? '#f0527a' : 'rgba(229,226,225,0.38)',
                            border: isActive
                              ? '1px solid rgba(220,46,115,0.2)'
                              : '1px solid transparent',
                          }}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span
                              className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold leading-none"
                              style={{
                                background: isActive ? 'rgba(220,46,115,0.2)' : 'rgba(255,255,255,0.07)',
                                color: isActive ? '#f0527a' : 'rgba(229,226,225,0.32)',
                              }}
                            >
                              {tab.count > 99 ? '99+' : tab.count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

                {/* ── Notification list ───────────────────────────────────── */}
                <div
                  role="list"
                  aria-label="Notification items"
                  className="overflow-y-auto flex-1 flex flex-col"
                  style={{ scrollbarWidth: 'none', minHeight: 0, maxHeight: '420px' }}
                >
                  {displayedNotifs.length === 0 ? (
                    <EmptyState tab={activeTab} />
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {displayedNotifs.map((notif, i) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                          >
                            <NotificationItem
                              notification={notif}
                              isLast={i === displayedNotifs.length - 1 && !hasMore}
                              isNew={newNotifIds.has(notif.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Load more */}
                      {hasMore && activeTab === 'all' && (
                        <button
                          type="button"
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="w-full py-3 text-[12px] font-medium transition-colors hover:bg-white/[0.03] disabled:opacity-40 focus:outline-none"
                          style={{
                            color: 'rgba(229,226,225,0.3)',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {loadingMore ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-3 h-3 rounded-full border border-white/25 border-t-white/60 animate-spin inline-block" />
                              Loading…
                            </span>
                          ) : (
                            'Load more'
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="h-1 flex-shrink-0" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
