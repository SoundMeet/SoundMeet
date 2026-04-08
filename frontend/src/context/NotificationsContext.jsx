/**
 * NotificationsContext
 *
 * Features:
 *   - Paginated fetch (20 at a time) + loadMore
 *   - Realtime INSERT for new notifications (with chime sound)
 *   - Realtime UPDATE on chat_notification (remote mark-as-read sync)
 *   - Realtime UPDATE on chat_friendrequest (auto-resolve from another session)
 *   - dismissNotification(ids) — optimistic delete
 *   - Per-type muting + sound toggle (localStorage)
 *   - markVisibleRead(ids) — mark specific IDs read
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../injectables/Auth'
import { socialService } from '../injectables/socialService'
import { supabase } from '../injectables/supaBaseClient'
import { useToast } from './ToastContext'
import {
  registerServiceWorker,
  getPushPermission,
  requestPushPermission,
  showBrowserNotification,
} from '../injectables/pushNotifications'

const NotificationsContext = createContext(null)

const PAGE_SIZE = 20
const PREFS_KEY = 'sm_notif_prefs'

// ─── Prefs helpers ────────────────────────────────────────────────────────────

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

// ─── Chime ────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    // Soft two-note descending bell: C6 → G5
    osc.frequency.setValueAtTime(1047, ctx.currentTime)
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.75)
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch {}
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildFromUser(rawUser) {
  if (!rawUser) return null
  const profile = rawUser.chat_profile
  return {
    id: rawUser.id,
    username: rawUser.username || '',
    displayName: profile?.display_name || rawUser.username || 'Someone',
    avatarUrl: profile?.pfp || null,
  }
}

function normalizeNotif(n, requestsById = {}, profilesById = {}) {
  const base = {
    id: n.id,
    message: n.message,
    isRead: n.is_read,
    createdAt: n.created_at,
    referenceId: n.reference_id,
    rawType: n.notification_type,
    accepted: false,
    declined: false,
  }

  if (n.notification_type === 'FRIEND_REQUEST') {
    const req = requestsById[n.reference_id]
    const alreadyAccepted = req?.status === 'ACCEPTED'
    const alreadyDenied = req?.status === 'DENIED'
    return {
      ...base,
      type: 'friend_request',
      fromUser: req ? buildFromUser(req.from_user) : null,
      accepted: alreadyAccepted,
      declined: alreadyDenied,
    }
  }

  if (n.notification_type === 'FRIEND_ACCEPTED') {
    const accepterId = n.metadata?.accepter_id
    const profile = accepterId != null ? profilesById[accepterId] : null
    return {
      ...base,
      type: 'friend_request_accepted',
      fromUser: {
        id: accepterId,
        username: '',
        displayName: profile?.display_name || 'Someone',
        avatarUrl: profile?.pfp || null,
      },
    }
  }

  if (n.notification_type === 'POST_LIKE') {
    const userId = n.metadata?.liker_id
    const profile = userId != null ? profilesById[userId] : null
    return {
      ...base,
      type: 'post_like',
      fromUser: profile
        ? { id: userId, username: '', displayName: profile.display_name || 'Someone', avatarUrl: profile.pfp || null }
        : null,
    }
  }

  if (n.notification_type === 'POST_COMMENT') {
    const userId = n.metadata?.commenter_id
    const profile = userId != null ? profilesById[userId] : null
    return {
      ...base,
      type: 'post_comment',
      fromUser: profile
        ? { id: userId, username: '', displayName: profile.display_name || 'Someone', avatarUrl: profile.pfp || null }
        : null,
    }
  }

  if (n.notification_type === 'JAM_INVITE') {
    const userId = n.metadata?.inviter_id
    const profile = userId != null ? profilesById[userId] : null
    return {
      ...base,
      type: 'jam_invite',
      fromUser: profile
        ? { id: userId, username: '', displayName: profile.display_name || 'Someone', avatarUrl: profile.pfp || null }
        : null,
    }
  }

  return {
    ...base,
    type: n.notification_type.toLowerCase(),
    fromUser: null,
  }
}

async function enrichNotifications(rawNotifs) {
  if (!rawNotifs.length) return []

  const requestIds = [
    ...new Set(
      rawNotifs
        .filter((n) => n.notification_type === 'FRIEND_REQUEST' && n.reference_id != null)
        .map((n) => n.reference_id)
    ),
  ]

  const accepterIds = [
    ...new Set(
      rawNotifs
        .filter((n) => n.notification_type === 'FRIEND_ACCEPTED' && n.metadata?.accepter_id != null)
        .map((n) => n.metadata.accepter_id)
    ),
  ]

  // Collect actor IDs from new notification types
  const metadataActorIds = [
    ...new Set(
      rawNotifs.flatMap((n) => {
        if (n.notification_type === 'POST_LIKE')    return n.metadata?.liker_id    != null ? [n.metadata.liker_id]    : []
        if (n.notification_type === 'POST_COMMENT') return n.metadata?.commenter_id != null ? [n.metadata.commenter_id] : []
        if (n.notification_type === 'JAM_INVITE')   return n.metadata?.inviter_id   != null ? [n.metadata.inviter_id]   : []
        return []
      })
    ),
  ]

  const allProfileIds = [...new Set([...accepterIds, ...metadataActorIds])]

  const [requestRows, profileRows] = await Promise.all([
    requestIds.length
      ? supabase
          .from('chat_friendrequest')
          .select(
            `id, status, from_user:from_user_id ( id, username, chat_profile ( display_name, pfp ) )`
          )
          .in('id', requestIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
    allProfileIds.length
      ? supabase
          .from('chat_profile')
          .select('user_id, display_name, pfp')
          .in('user_id', allProfileIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ])

  const requestsById = Object.fromEntries(requestRows.map((r) => [r.id, r]))
  const profilesById = Object.fromEntries(profileRows.map((p) => [p.user_id, p]))

  return rawNotifs.map((n) => normalizeNotif(n, requestsById, profilesById))
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [notifications, setNotifications] = useState([])
  const [loadingIds, setLoadingIds] = useState(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(0)

  // New notification IDs (for entry animation) — cleared after 3s
  const [newNotifIds, setNewNotifIds] = useState(new Set())
  const newTimersRef = useRef(new Map())

  // Push notification permission state
  const [pushPermission, setPushPermission] = useState(() => getPushPermission())
  const [pushEnabled, setPushEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_push_enabled') ?? 'true') } catch { return true }
  })

  // Prefs: mutedTypes + soundEnabled
  const [prefs, setPrefs] = useState(() => {
    const p = loadPrefs()
    return {
      mutedTypes: p.mutedTypes ?? [],
      soundEnabled: p.soundEnabled ?? true,
    }
  })

  const mutedTypes = prefs.mutedTypes
  const soundEnabled = prefs.soundEnabled

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  const toggleMuteType = useCallback((type) => {
    setPrefs((prev) => {
      const muted = prev.mutedTypes.includes(type)
        ? prev.mutedTypes.filter((t) => t !== type)
        : [...prev.mutedTypes, type]
      const next = { ...prev, mutedTypes: muted }
      savePrefs(next)
      return next
    })
  }, [])

  const toggleSound = useCallback(() => {
    updatePrefs({ soundEnabled: !prefs.soundEnabled })
  }, [prefs.soundEnabled, updatePrefs])

  // ── Service worker registration (once on mount) ──
  useEffect(() => {
    registerServiceWorker()
  }, [])

  // ── Push permission helpers ──
  const enablePush = useCallback(async () => {
    const perm = await requestPushPermission()
    setPushPermission(perm)
    if (perm === 'granted') {
      setPushEnabled(true)
      localStorage.setItem('sm_push_enabled', 'true')
    }
    return perm
  }, [])

  const togglePush = useCallback(async () => {
    if (pushPermission === 'denied') return // can't re-enable if blocked
    if (pushPermission !== 'granted') {
      await enablePush()
      return
    }
    const next = !pushEnabled
    setPushEnabled(next)
    localStorage.setItem('sm_push_enabled', String(next))
  }, [pushPermission, pushEnabled, enablePush])

  // Derived
  const unreadCount = notifications.filter(
    (n) => !n.isRead && !mutedTypes.includes(n.type)
  ).length

  const friendRequests = notifications.filter(
    (n) => n.type === 'friend_request' && !n.accepted && !n.declined
  )

  // ── Initial fetch ──
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      pageRef.current = 0
      setHasMore(true)
      return
    }
    socialService
      .getMyNotifications(user.id, PAGE_SIZE, 0)
      .then((raw) => enrichNotifications(raw))
      .then((normalized) => {
        setNotifications(normalized)
        pageRef.current = 0
        setHasMore(normalized.length === PAGE_SIZE)
      })
      .catch((err) => console.error('Failed to load notifications:', err))
  }, [user?.id])

  // ── Load more (pagination) ──
  const loadMore = useCallback(async () => {
    if (!user?.id || loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextOffset = (pageRef.current + 1) * PAGE_SIZE
    try {
      const raw = await socialService.getMyNotifications(user.id, PAGE_SIZE, nextOffset)
      const normalized = await enrichNotifications(raw)
      if (normalized.length < PAGE_SIZE) setHasMore(false)
      setNotifications((prev) => {
        const ids = new Set(prev.map((n) => n.id))
        return [...prev, ...normalized.filter((n) => !ids.has(n.id))]
      })
      pageRef.current += 1
    } catch (err) {
      console.error('Failed to load more notifications:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [user?.id, loadingMore, hasMore])

  // ── Realtime: INSERT + UPDATE on chat_notification ──
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifs_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notification',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const [enriched] = await enrichNotifications([payload.new]).catch(() => [null])
          if (!enriched) return

          setNotifications((prev) => {
            if (prev.some((n) => n.id === enriched.id)) return prev
            return [enriched, ...prev]
          })

          // Track as new for entry animation (cleared after 3s)
          setNewNotifIds((prev) => new Set(prev).add(enriched.id))
          const timer = setTimeout(() => {
            setNewNotifIds((prev) => {
              const next = new Set(prev)
              next.delete(enriched.id)
              return next
            })
            newTimersRef.current.delete(enriched.id)
          }, 3000)
          newTimersRef.current.set(enriched.id, timer)

          // Chime (if sound on and type not muted)
          if (soundEnabled && !mutedTypes.includes(enriched.type)) {
            playChime()
          }

          // Browser push notification (when tab not visible)
          if (pushEnabled && pushPermission === 'granted' && !mutedTypes.includes(enriched.type)) {
            const name = enriched.fromUser?.displayName || 'SoundMeet'
            const body = enriched.message || 'You have a new notification'
            showBrowserNotification(name, body)
          }

          // Toast for friend accepted
          if (enriched.type === 'friend_request_accepted') {
            const name = enriched.fromUser?.displayName || 'Someone'
            showToast(`${name} accepted your friend request`, 'success')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_notification',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { id, is_read } = payload.new
          if (is_read) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            )
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, soundEnabled, mutedTypes, showToast])

  // ── Realtime: UPDATE on chat_friendrequest (remote accept/decline) ──
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`friend_req_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_friendrequest',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => {
          const { id: requestId, status } = payload.new
          if (status === 'ACCEPTED') {
            setNotifications((prev) =>
              prev.map((n) =>
                n.type === 'friend_request' && n.referenceId === requestId
                  ? { ...n, accepted: true, isRead: true }
                  : n
              )
            )
          } else if (status === 'DENIED') {
            setNotifications((prev) =>
              prev.map((n) =>
                n.type === 'friend_request' && n.referenceId === requestId
                  ? { ...n, declined: true, isRead: true }
                  : n
              )
            )
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  // ── Mark single notification read ──
  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await socialService.markNotificationAsRead(id)
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }, [])

  // ── Mark specific IDs as read (for auto mark-read on panel open) ──
  const markVisibleRead = useCallback(async (ids) => {
    if (!ids.length) return
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
    )
    try {
      await Promise.all(ids.map((id) => socialService.markNotificationAsRead(id)))
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }, [])

  // ── Mark all read ──
  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (!unreadIds.length) return
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await Promise.all(unreadIds.map((id) => socialService.markNotificationAsRead(id)))
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  }, [notifications])

  // ── Dismiss (delete) notifications ──
  const dismissNotification = useCallback(async (ids) => {
    const idArr = Array.isArray(ids) ? ids : [ids]
    setNotifications((prev) => prev.filter((n) => !idArr.includes(n.id)))
    try {
      await Promise.all(idArr.map((id) => socialService.deleteNotification(id)))
    } catch (err) {
      console.error('Failed to dismiss notification:', err)
    }
  }, [])

  // ── Accept friend request ──
  const acceptRequest = useCallback(
    async (notificationId, requestId) => {
      if (loadingIds.has(notificationId)) return
      setLoadingIds((prev) => new Set(prev).add(notificationId))
      try {
        await socialService.handleFriendRequest(requestId, 'ACCEPT')
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, accepted: true, isRead: true } : n
          )
        )
        showToast('Friend request accepted', 'success')
      } catch (err) {
        const detail = err?.detail || err?.error || ''
        if (detail.toLowerCase().includes('already') || detail.toLowerCase().includes('not found')) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, accepted: true, isRead: true } : n
            )
          )
        } else {
          showToast(detail || 'Could not accept friend request', 'error')
        }
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
      }
    },
    [loadingIds, showToast]
  )

  // ── Cleanup new-notif timers on unmount ──
  useEffect(() => {
    return () => {
      newTimersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  // ── Decline friend request ──
  const declineRequest = useCallback(
    async (notificationId, requestId) => {
      if (loadingIds.has(notificationId)) return
      setLoadingIds((prev) => new Set(prev).add(notificationId))
      try {
        await socialService.handleFriendRequest(requestId, 'DENY')
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, declined: true, isRead: true } : n
          )
        )
      } catch (err) {
        const detail = err?.detail || err?.error || ''
        showToast(detail || 'Could not decline friend request', 'error')
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
      }
    },
    [loadingIds, showToast]
  )

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        friendRequests,
        loadingIds,
        hasMore,
        loadingMore,
        loadMore,
        newNotifIds,
        mutedTypes,
        soundEnabled,
        toggleMuteType,
        toggleSound,
        pushPermission,
        pushEnabled,
        togglePush,
        markRead,
        markVisibleRead,
        markAllRead,
        dismissNotification,
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
