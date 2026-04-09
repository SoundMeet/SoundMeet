import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Settings, ChevronLeft, Volume2, VolumeX, BellOff } from 'lucide-react'
import { UserPlus, UserCheck, Heart, MessageCircle, Music, UserRound } from 'lucide-react'
import { Smartphone } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'
import { NotificationItem } from './NotificationItem'

// ─── Grouping ─────────────────────────────────────────────────────────────────

const GROUPABLE = new Set(['post_like', 'new_follower'])

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
      const g = {
        ...n,
        id: `group::${key}`,
        _group: true,
        _members: [{ ...n }],
        _count: 1,
      }
      buckets.set(key, g)
      ordered.push(g)
    }
  }
  return ordered
}

// ─── Settings panel types ─────────────────────────────────────────────────────

const PREF_TYPES = [
  { type: 'friend_request', label: 'Friend requests', Icon: UserPlus },
  { type: 'friend_request_accepted', label: 'Friend acceptances', Icon: UserCheck },
  { type: 'post_like', label: 'Post likes', Icon: Heart },
  { type: 'post_comment', label: 'Post comments', Icon: MessageCircle },
  { type: 'jam_invite', label: 'Jam invites', Icon: Music },
  { type: 'new_follower', label: 'New followers', Icon: UserRound },
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

function SettingsPanel({
  onBack,
  mutedTypes, soundEnabled, toggleMuteType, toggleSound,
  pushPermission, pushEnabled, togglePush,
}) {
  const pushBlocked = pushPermission === 'denied'
  const pushUnsupported = pushPermission === 'unsupported'
  const pushActive = pushEnabled && pushPermission === 'granted'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-lg transition-colors hover:bg-white/[0.06] focus:outline-none"
          aria-label="Back"
        >
          <ChevronLeft size={16} style={{ color: 'rgba(229,226,225,0.6)' }} />
        </button>
        <span className="text-[13px] font-semibold" style={{ color: 'rgba(229,226,225,0.85)' }}>
          Notification settings
        </span>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

      {/* Browser push */}
      {!pushUnsupported && (
        <>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(229,226,225,0.3)' }}>
              Browser
            </p>
            <div className="flex items-start justify-between py-1">
              <div className="flex items-start gap-2.5">
                <Smartphone size={14} className="mt-0.5 flex-shrink-0"
                  style={{ color: pushActive ? 'rgba(229,226,225,0.55)' : 'rgba(229,226,225,0.25)' }} />
                <div>
                  <span className="text-[13px]" style={{ color: 'rgba(229,226,225,0.75)' }}>
                    Push notifications
                  </span>
                  {pushBlocked && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(220,46,115,0.7)' }}>
                      Blocked in browser — allow in site settings
                    </p>
                  )}
                  {pushPermission === 'default' && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.3)' }}>
                      Toggle to request permission
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                enabled={pushActive}
                onChange={togglePush}
                label="Push notifications"
                disabled={pushBlocked}
              />
            </div>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
        </>
      )}

      {/* Sound toggle */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'rgba(229,226,225,0.3)' }}>
          Sound
        </p>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            {soundEnabled
              ? <Volume2 size={14} style={{ color: 'rgba(229,226,225,0.55)' }} />
              : <VolumeX size={14} style={{ color: 'rgba(229,226,225,0.3)' }} />
            }
            <span className="text-[13px]" style={{ color: 'rgba(229,226,225,0.75)' }}>
              Play chime on new notification
            </span>
          </div>
          <Toggle enabled={soundEnabled} onChange={toggleSound} label="Notification sound" />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

      {/* Per-type muting */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'rgba(229,226,225,0.3)' }}>
          Show in notifications
        </p>
        <div className="flex flex-col gap-0.5">
          {PREF_TYPES.map(({ type, label, Icon }) => {
            const enabled = !mutedTypes.includes(type)
            return (
              <div key={type} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <Icon size={13} style={{ color: enabled ? 'rgba(229,226,225,0.55)' : 'rgba(229,226,225,0.2)' }} />
                  <span
                    className="text-[13px] transition-colors"
                    style={{ color: enabled ? 'rgba(229,226,225,0.75)' : 'rgba(229,226,225,0.3)' }}
                  >
                    {label}
                  </span>
                </div>
                <Toggle
                  enabled={enabled}
                  onChange={() => toggleMuteType(type)}
                  label={`Toggle ${label}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-2 flex-shrink-0" />
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

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const containerRef = useRef(null)
  const location = useLocation()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close when the route changes (e.g. user navigated via a deep link)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  // Auto mark-read: 2s after the panel opens, silently mark visible unread as read
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

  return (
    <div ref={containerRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-white opacity-90 hover:opacity-100 transition-opacity" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: '#ef4444', lineHeight: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-3 z-[200] w-[380px] max-w-[calc(100vw-16px)] flex flex-col rounded-2xl"
            style={{
              background: 'rgba(13,13,13,0.98)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(220,46,115,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
              maxHeight: '560px',
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
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-0 flex-shrink-0">
                  <span className="text-[15px] font-bold tracking-tight"
                    style={{ color: 'rgba(255,255,255,0.92)' }}>
                    Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] font-medium transition-opacity hover:opacity-70 focus:outline-none"
                        style={{ color: '#DC2E73' }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="p-1 rounded-lg transition-colors hover:bg-white/[0.06] focus:outline-none"
                      aria-label="Notification settings"
                    >
                      <Settings size={14} style={{ color: 'rgba(229,226,225,0.4)' }} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-5 pt-3 pb-2 flex-shrink-0">
                  <div
                    className="flex rounded-xl p-[3px] gap-[3px]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {[
                      { key: 'all', label: 'All' },
                      {
                        key: 'requests',
                        label: friendRequests.length > 0
                          ? `Requests · ${friendRequests.length}`
                          : 'Requests',
                      },
                    ].map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className="flex-1 py-[7px] rounded-[9px] text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500"
                          style={{
                            background: isActive ? 'rgba(220,46,115,0.18)' : 'transparent',
                            color: isActive ? '#F0527A' : 'rgba(229,226,225,0.5)',
                            border: isActive
                              ? '1px solid rgba(220,46,115,0.28)'
                              : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

                {/* Notification list */}
                <div
                  className="overflow-y-auto flex-1 flex flex-col"
                  style={{ scrollbarWidth: 'none', minHeight: 0, maxHeight: '420px' }}
                >
                  {displayedNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(220,46,115,0.08)',
                          border: '1px solid rgba(220,46,115,0.15)',
                        }}
                      >
                        <BellOff size={17} style={{ color: '#DC2E73', opacity: 0.55 }} />
                      </div>
                      <p className="text-[13px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
                        {activeTab === 'requests' ? 'No pending requests' : 'All caught up'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {displayedNotifs.map((notif, i) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
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
                          className="w-full py-3 text-[12px] font-medium transition-colors hover:bg-white/[0.03] disabled:opacity-50 focus:outline-none"
                          style={{
                            color: 'rgba(229,226,225,0.4)',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {loadingMore ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white/70 animate-spin inline-block" />
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
