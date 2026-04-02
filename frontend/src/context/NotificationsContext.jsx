/**
 * NotificationsContext
 *
 * Provides notifications, unread count, friend requests, and actions.
 * Currently backed by mock data — swap the mock arrays for fetch() calls
 * without changing any component code (same function signatures, same shapes).
 *
 * Future API surface:
 *   GET  /api/notifications/
 *   POST /api/notifications/{id}/read/
 *   POST /api/notifications/read-all/
 *   GET  /api/friends/requests/incoming/
 *   POST /api/friends/accept/{request_id}/
 *   POST /api/friends/decline/{request_id}/
 *   WS   /ws/notifications/{user_id}/
 */
import { createContext, useContext, useState, useCallback } from 'react'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [friendRequests, setFriendRequests] = useState([])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Mark a single notification as read
  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }, [])

  // Mark all notifications as read
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  // Accept a friend request by userId
  const acceptRequest = useCallback((userId) => {
    setFriendRequests((prev) => prev.filter((r) => r.fromUser.id !== userId))
    setNotifications((prev) =>
      prev.map((n) =>
        n.type === 'friend_request' && n.fromUser.id === userId
          ? { ...n, isRead: true }
          : n
      )
    )
  }, [])

  // Decline a friend request by userId
  const declineRequest = useCallback((userId) => {
    setFriendRequests((prev) => prev.filter((r) => r.fromUser.id !== userId))
    setNotifications((prev) =>
      prev.map((n) =>
        n.type === 'friend_request' && n.fromUser.id === userId
          ? { ...n, isRead: true }
          : n
      )
    )
  }, [])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        friendRequests,
        markRead,
        markAllRead,
        acceptRequest,
        declineRequest,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
