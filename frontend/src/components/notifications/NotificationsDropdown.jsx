import { useState, useRef, useEffect } from 'react'
import { MdNotificationsNone } from 'react-icons/md'
import { useNotifications } from '../../context/NotificationsContext'
import { NotificationItem } from './NotificationItem'

export function NotificationsDropdown() {
  const { notifications, unreadCount, friendRequests, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const containerRef = useRef(null)

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

  const friendRequestNotifs = notifications.filter((n) => n.type === 'friend_request')
  const displayedNotifs =
    activeTab === 'requests' ? friendRequestNotifs : notifications

  return (
    <div ref={containerRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative focus:outline-none"
        aria-label="Notifications"
      >
        <MdNotificationsNone className="text-xl md:text-2xl cursor-pointer text-white" />
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
      {open && (
        <div
          className="absolute right-0 top-full mt-3 z-[200] w-[360px] max-w-[calc(100vw-16px)] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(18,18,18,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,46,115,0.06)',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium transition-colors hover:text-white"
                style={{ color: '#DC2E73' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {[
              { key: 'all', label: 'All' },
              {
                key: 'requests',
                label: `Requests${friendRequests.length > 0 ? ` (${friendRequests.length})` : ''}`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: activeTab === tab.key ? '#DC2E73' : 'rgba(229,226,225,0.4)',
                  borderBottom:
                    activeTab === tab.key ? '2px solid #DC2E73' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {displayedNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-2xl">🔔</span>
                <p className="text-sm" style={{ color: 'rgba(229,226,225,0.35)' }}>
                  {activeTab === 'requests' ? 'No pending requests' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              displayedNotifs.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
