import { useState, useEffect, useRef, useMemo } from 'react'
import { Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import ChatComposer from '../components/chat/ChatComposer'
import EventDetailModal from '../components/event-detail/EventDetailModal'
import { JamChatMembersModal } from '../components/chat/JamChatMembersModal'
import { DestructiveConfirmSheet } from '../components/event-detail/DestructiveConfirmSheet'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { chatService } from '../injectables/chatService'
import { supabase } from '../injectables/supaBaseClient'
import { jamService } from '../injectables/jamService'
import { useToast } from '../context/ToastContext'
import { ProfilesRUS } from '../services/ProfilesRUS'


const SUPABASE_URL = "https://hbdoqesapzedjwdgtnyq.supabase.co"; 
const BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/media/`;
function formatAvatarUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${BUCKET_URL}${cleanPath}`;
}

// ─── Jam role helper — jam-specific role only, never global profile data ──────
function deriveRole(attendee) {
  if (attendee.rolesBringing?.length > 0)       return attendee.rolesBringing[0]
  if (attendee.instrumentsBringing?.length > 0) return attendee.instrumentsBringing[0]
  return null
}

function normalizeMessage(row) {
  const d = new Date(row.timestamp)
  return {
    id:        String(row.id),
    senderId:  String(row.sender_id),
    type:      'text',
    content:   row.content ?? '',
    timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rawDate:   d.toDateString(),   // used for date-separator grouping
    isoDate:   d.toISOString(),    // full ISO for display label formatting
  }
}

const Chat = () => {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth()
  const { openModal } = useAuthModal()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // ─── State ────────────────────────────────────────────────────────────────
  const [dmThreads, setDmThreads]           = useState([])
  const [jamThreads, setJamThreads]         = useState([])
  const [chatUsers, setChatUsers]           = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [messagesByThread, setMessagesByThread] = useState({})
  const [isLoadingConvs, setIsLoadingConvs] = useState(false)
  const [isLoadingMsgs, setIsLoadingMsgs]   = useState(false)
  const [convError, setConvError]           = useState(null)
  const [sendError, setSendError]           = useState(null)
  const [jamDetailModal, setJamDetailModal]   = useState({ open: false, item: null })
  const [attendeesModal, setAttendeesModal]   = useState({ open: false, item: null })
  const [hideDMConfirm,  setHideDMConfirm]    = useState(false)
  const [hideDMTarget,   setHideDMTarget]     = useState(null)
  const [hidingDM,       setHidingDM]         = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth < 1024)
  const [dmProfileCard, setDmProfileCard] = useState(null) // { name, avatar, profileId }

  // Open sidebar by default on mobile, close it when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // { [jamId]: { adminId: string|null, attendees: JamAttendee[] } }
  const [jamAttendeeCache, setJamAttendeeCache] = useState({})
  // Conversation ID we intend to open — set as soon as getOrCreateDMChat resolves,
  // cleared once the thread is visible and selected in the sidebar.
  const [pendingConvId, setPendingConvId] = useState(null)

  const unsubRef = useRef(null)
  // Prevents Stage A (resolve) from re-running for the same navigation entry.
  const openDmWithHandledRef = useRef(null)
  // Holds minimal target info so Stage B can synthesise the thread even if the
  // initial conversation load query ran before the DB restore completed.
  const pendingDmTargetRef = useRef(null)

  // ─── Current user normalised for chat components ──────────────────────────
  const chatCurrentUser = isLoggedIn && user
    ? {
        id: String(user.id),
        name: user.display_name || user.username || 'Me',
        avatar: user.pfp ?? null,
      }
    : null

  // ─── Load conversations on login ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setDmThreads([])
      setJamThreads([])
      setChatUsers([])
      setMessagesByThread({})
      setActiveThreadId(null)
      return
    }

    let cancelled = false
    setIsLoadingConvs(true)
    setConvError(null)

    chatService.getUserConversations(user.id)
      .then(async (conversations) => {
        if (cancelled) return

        const convIds = conversations.map(c => c.id)

        const allParticipants = convIds.length
          ? await chatService.getParticipantsForConversations(convIds).catch(() => [])
          : []

        const dms = []
        const jams = []
        const usersMap = {}
        const missingUserIds = new Set()

        if (chatCurrentUser) usersMap[chatCurrentUser.id] = chatCurrentUser

        const jamConvIds = conversations.filter(c => c.jam_id).map(c => c.jam_id)
        const [jamNames, lastMsgMap] = await Promise.all([
          jamConvIds.length
            ? jamService.getJamNames(jamConvIds).catch(() => ({}))
            : Promise.resolve({}),
          convIds.length
            ? chatService.getLastMessagesForConversations(conversations).catch(() => ({}))
            : Promise.resolve({}),
        ])

        conversations.forEach((conv) => {
          const threadId = `c_${conv.id}`
          const participants = allParticipants.filter(
            p => p.conversation_id === conv.id
          )

          const rawLast = lastMsgMap[String(conv.id)] ?? null
          const lastMessage = rawLast ? {
            senderId:     String(rawLast.sender_id),
            content:      rawLast.content ?? '',
            isoTimestamp: rawLast.timestamp,
          } : null

          if (conv.jam_id) {
            jams.push({
              id: threadId,
              _convId: conv.id,
              type: 'jam',
              name: jamNames[String(conv.jam_id)] ?? `Jam #${conv.jam_id}`,
              active: false,
              memberCount: participants.length,
              jamId: String(conv.jam_id),
              unread: conv.unreadCount ?? 0,
              lastMessage,
            })
          } else {
            const otherParticipant = participants.find(
              p => String(p.user_id) !== String(user.id)
            )
            const otherUserId = otherParticipant
              ? String(otherParticipant.user_id)
              : null

            if (otherUserId && !usersMap[otherUserId]) {
              missingUserIds.add(otherUserId)
              usersMap[otherUserId] = {
                id: otherUserId,
                name: `Loading...`,
                avatar: null,
              }
            }

            dms.push({
              id: threadId,
              _convId: conv.id,
              type: 'dm',
              participantId: otherUserId,
              unread: conv.unreadCount ?? 0,
              lastMessage,
            })
          }
        })

        // ─── FETCH MISSING PROFILES DIRECTLY FROM DATABASE ───
        const missingIdsArray = Array.from(missingUserIds)
        if (missingIdsArray.length > 0) {
          try {
            const profiles = await chatService.getUsersProfiles(missingIdsArray)
            
            profiles.forEach(profile => {
              const uid = String(profile.user_id)
              usersMap[uid] = {
                id: uid,
                name: profile.display_name || `User #${uid}`,
                avatar: formatAvatarUrl(profile.pfp),
                profileId: profile.id ?? null,
              }
            })
          } catch (err) {
            console.error('[Chat] Error fetching profiles from database:', err)
          }
        }

        // Deduplicate DMs: one thread per participant, keep the most recent.
        // Duplicate conversations can exist from earlier data — don't show them all.
        const dedupedDms = Object.values(
          dms.reduce((acc, dm) => {
            const key = dm.participantId ?? dm._convId
            const existing = acc[key]
            if (!existing) {
              acc[key] = dm
            } else {
              const existingTs = existing.lastMessage?.isoTimestamp ?? ''
              const newTs      = dm.lastMessage?.isoTimestamp ?? ''
              if (newTs > existingTs) acc[key] = dm
            }
            return acc
          }, {})
        )

        // Sort helper: newest lastMessage.isoTimestamp first, no-message threads last.
        const byLastMsg = (a, b) => {
          const ta = a.lastMessage?.isoTimestamp ?? ''
          const tb = b.lastMessage?.isoTimestamp ?? ''
          return tb < ta ? -1 : tb > ta ? 1 : 0
        }

        if (!cancelled) {
          setDmThreads([...dedupedDms].sort(byLastMsg))
          setJamThreads([...jams].sort(byLastMsg))
          // Merge rather than replace: freshly fetched DB profiles take precedence,
          // but preserve any user already in state that is not in this batch —
          // e.g. a DM target whose conversation was hidden and therefore excluded
          // from getUserConversations. Without this, Stage A's profile injection
          // is wiped and the chat header falls back to "?".
          setChatUsers((prev) => {
            const merged = {}
            for (const u of prev) merged[u.id] = u
            for (const [id, u] of Object.entries(usersMap)) merged[id] = u
            return Object.values(merged)
          })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[Chat] Failed to load conversations:', err)
          setConvError('Could not load your conversations.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConvs(false)
      })

    return () => { cancelled = true }
  }, [isLoggedIn, user?.id])
  // ---------------------------------------------------------


  // ─── Subscription A: participant row updates → unread badge ───────────────
  // Fires when the trigger increments unread_count for this user (message
  // arrived in a conversation they are not currently viewing) or when
  // mark-as-read zeroes it on another device/tab.
  //
  // Subscription B: conversation row updates → preview + list reorder
  // Fires when last_message_at changes (trigger ran after a new message).
  // The backend value is authoritative — we patch lastMessage.isoTimestamp
  // and re-sort both thread arrays so the list order matches the DB.
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return

    const allConvIds = [...dmThreads, ...jamThreads].map(t => t._convId).filter(Boolean)
    if (allConvIds.length === 0) return

    // ── Subscription A ────────────────────────────────────────────────────────
    const subA = supabase
      .channel(`unread_badges_${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'chat_conversation_participants',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { conversation_id, unread_count } = payload.new
          const convId = String(conversation_id)
          setDmThreads(prev => prev.map(t =>
            String(t._convId) === convId ? { ...t, unread: unread_count ?? 0 } : t
          ))
          setJamThreads(prev => prev.map(t =>
            String(t._convId) === convId ? { ...t, unread: unread_count ?? 0 } : t
          ))
        }
      )
      .subscribe()

    // ── Subscription B ────────────────────────────────────────────────────────
    const subB = supabase
      .channel(`conv_summary_${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'chat_conversation',
          filter: `id=in.(${allConvIds.join(',')})`,
        },
        (payload) => {
          const { id, last_message_at } = payload.new
          if (!last_message_at) return
          const convId = String(id)
          const patchThread = t => String(t._convId) === convId
            ? { ...t, lastMessage: { ...(t.lastMessage ?? {}), isoTimestamp: last_message_at } }
            : t
          setDmThreads(prev => {
            const patched = prev.map(patchThread)
            return [...patched].sort((a, b) => {
              const ta = a.lastMessage?.isoTimestamp ?? ''
              const tb = b.lastMessage?.isoTimestamp ?? ''
              return tb < ta ? -1 : tb > ta ? 1 : 0
            })
          })
          setJamThreads(prev => {
            const patched = prev.map(patchThread)
            return [...patched].sort((a, b) => {
              const ta = a.lastMessage?.isoTimestamp ?? ''
              const tb = b.lastMessage?.isoTimestamp ?? ''
              return tb < ta ? -1 : tb > ta ? 1 : 0
            })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subA)
      supabase.removeChannel(subB)
    }
  // Re-subscribe when the conversation list changes (new conv added / removed).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id, dmThreads.length, jamThreads.length])
  // ---------------------------------------------------------


  // ─── Stage A: Resolve the canonical DM conversation id ───────────────────
  // Starts immediately on navigation — does NOT wait for isLoadingConvs.
  // Calling getOrCreateDMChat early means the DB restore can race ahead of (or
  // overlap with) the getUserConversations query that populates dmThreads.
  // Stage B (below) handles activation once threads are fully hydrated.
  useEffect(() => {
    const target = location.state?.openDmWith
    if (!target?.id || !isLoggedIn || !user?.id) return

    // One resolve per navigation entry — location.key is unique per push/replace.
    const handledKey = `${location.key}:${user.id}:${target.id}`
    if (openDmWithHandledRef.current === handledKey) return
    openDmWithHandledRef.current = handledKey

    // Clear any stale pending intent from a previous navigation.
    setPendingConvId(null)
    pendingDmTargetRef.current = null

    // Store target profile so Stage B can synthesise the thread without relying
    // on location.state being available later.
    // FriendListItem sends camelCase keys (displayName, avatarUrl).
    // Support both spellings so the profile resolves on every navigation path.
    const targetProfile = {
      id: String(target.id),
      name: target.displayName || target.display_name || target.username || `User #${target.id}`,
      avatar: formatAvatarUrl(target.avatarUrl ?? target.pfp ?? null),
      profileId: target.profileId ?? null,
    }
    pendingDmTargetRef.current = targetProfile

    // Ensure the friend's profile is available for name/avatar rendering.
    setChatUsers((prev) =>
      prev.some((u) => u.id === targetProfile.id)
        ? prev
        : [...prev, { ...targetProfile }]
    )

    // Quick path: if the DM is already visible in the loaded thread list we can
    // skip the round-trip and signal Stage B directly.
    const existingThread = dmThreads.find(
      (t) => String(t.participantId) === String(target.id)
    )
    if (existingThread) {
      setPendingConvId(existingThread._convId)
      return
    }

    // Slow path: resolve (find / restore / create) against the database.
    chatService.getOrCreateDMChat(user.id, target.id)
      .then((convId) => {
        setPendingConvId(convId)
      })
      .catch((err) => {
        console.error('[Chat] Failed to resolve DM with friend:', err)
        pendingDmTargetRef.current = null
      })
  // dmThreads is a snapshot used for the quick-path only — we intentionally
  // do NOT add it to deps so this effect fires exactly once per navigation entry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.key, isLoggedIn, user?.id])

  // ─── Stage B: Activate the resolved conversation after threads hydrate ────
  // Runs whenever pendingConvId, dmThreads, or isLoadingConvs changes.
  // Separating "resolve" from "activate" means Stage A never races with the
  // initial conversation load — activation simply waits until dmThreads is ready.
  useEffect(() => {
    if (!pendingConvId || isLoadingConvs) return

    const threadId = `c_${pendingConvId}`

    // Happy path: the thread is already in the loaded list.
    const thread = dmThreads.find((t) => t._convId === pendingConvId)
    if (thread) {
      setActiveThreadId(thread.id)
      setPendingConvId(null)
      pendingDmTargetRef.current = null
      return
    }

    // Recovery path: getUserConversations ran before the DB restore completed
    // (left_at was still set at query time), so the thread was excluded from the
    // initial load. We synthesise it from the stored target info and add it.
    const pending = pendingDmTargetRef.current
    if (!pending) return

    const newThread = {
      id: threadId,
      _convId: pendingConvId,
      type: 'dm',
      participantId: pending.id,
      unread: 0,
      lastMessage: null,
    }
    setDmThreads((prev) => {
      // Remove any stale entry for this participant, then add the canonical one.
      const withoutStale = prev.filter((t) => t.participantId !== pending.id)
      if (withoutStale.some((t) => t._convId === pendingConvId)) return prev
      return [...withoutStale, newThread]
    })
    setActiveThreadId(threadId)
    setPendingConvId(null)
    pendingDmTargetRef.current = null
  }, [pendingConvId, dmThreads, isLoadingConvs])

  // ─── Auto-open jam chat when navigated from the jam detail modal ──────────
  useEffect(() => {
    const jamId = location.state?.openJamId
    if (!jamId || !isLoggedIn || isLoadingConvs) return

    const thread = jamThreads.find((t) => String(t.jamId) === String(jamId))
    if (thread) setActiveThreadId(thread.id)
  }, [location.state, isLoggedIn, isLoadingConvs, jamThreads])

  // ─── Load messages + subscribe when active thread changes ─────────────────
  useEffect(() => {
    if (!activeThreadId || !isLoggedIn) return

    const allThreads = [...jamThreads, ...dmThreads]
    const thread = allThreads.find(t => t.id === activeThreadId)
    if (!thread?._convId) return

    unsubRef.current?.()
    unsubRef.current = null

    let cancelled = false
    setIsLoadingMsgs(true)

    // Debounce timer for mark-as-read while thread stays active.
    // We do NOT call markConversationRead on every incoming message —
    // instead we debounce so multi-tab/device churn is minimal.
    let markReadTimer = null
    const scheduleMarkRead = (latestId) => {
      clearTimeout(markReadTimer)
      markReadTimer = setTimeout(() => {
        if (!cancelled && user?.id && latestId) {
          chatService.markConversationRead(thread._convId, user.id, latestId)
            .catch(err => console.error('[Chat] markConversationRead failed:', err))
        }
      }, 1500)
    }

    chatService.getMessages(thread._convId)
      .then((rows) => {
        if (cancelled) return
        setMessagesByThread(prev => ({
          ...prev,
          [activeThreadId]: rows.map(normalizeMessage),
        }))
        // Zero out the badge immediately in local state for instant feedback,
        // then commit to DB via debounced write.
        if (rows.length > 0) {
          const latestId = rows[rows.length - 1].id
          setDmThreads(prev => prev.map(t =>
            t.id === activeThreadId ? { ...t, unread: 0 } : t
          ))
          setJamThreads(prev => prev.map(t =>
            t.id === activeThreadId ? { ...t, unread: 0 } : t
          ))
          scheduleMarkRead(latestId)
        }
      })
      .catch((err) => {
        console.error('[Chat] Failed to load messages:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMsgs(false)
      })

    unsubRef.current = chatService.subscribeToMessages(thread._convId, (newRow) => {
      const msg = normalizeMessage(newRow)
      setMessagesByThread(prev => {
        const existing = prev[activeThreadId] ?? []
        if (existing.some(m => m.id === msg.id)) return prev
        return { ...prev, [activeThreadId]: [...existing, msg] }
      })
      // Keep sidebar preview in sync for the active thread
      const lastMessage = {
        senderId:     String(newRow.sender_id),
        content:      newRow.content ?? '',
        isoTimestamp: newRow.timestamp,
      }
      setDmThreads(prev => prev.map(t =>
        t.id === activeThreadId ? { ...t, lastMessage } : t
      ))
      setJamThreads(prev => prev.map(t =>
        t.id === activeThreadId ? { ...t, lastMessage } : t
      ))
      // Debounce mark-as-read for messages arriving while thread is active.
      scheduleMarkRead(newRow.id)
    })

    return () => {
      cancelled = true
      clearTimeout(markReadTimer)
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [activeThreadId, isLoggedIn])

  useEffect(() => () => unsubRef.current?.(), [])

  // ─── View Jam ─────────────────────────────────────────────────────────────
  const handleViewJam = async () => {
    if (!activeThread?.jamId) return
    try {
      const item = await jamService.getJamById(activeThread.jamId)
      setJamDetailModal({ open: true, item })
    } catch (err) {
      console.error('[Chat] Failed to load jam:', err)
      showToast('Could not load jam details.', 'error')
    }
  }

  // ─── Header click / members pill → JamChatMembersModal ──────────────────
  const handleHeaderClick = async () => {
    if (!activeThread?.jamId) return
    try {
      const item = await jamService.getJamById(activeThread.jamId)
      if (!item) return
      setAttendeesModal({ open: true, item })
    } catch (err) {
      console.error('[Chat] Failed to load jam for attendees:', err)
      showToast('Could not load attendees.', 'error')
    }
  }

  // ─── DM hide ──────────────────────────────────────────────────────────────
  // Called from header ⋮ button (no item arg — uses activeThread)
  // or from long-press on sidebar item (item arg provided)
  const handleHideDM = (item) => {
    const target = item ?? activeThread
    if (!target || target.type !== 'dm') return
    setHideDMTarget(target)
    setHideDMConfirm(true)
  }

  const handleConfirmHideDM = async () => {
    if (!hideDMTarget?._convId || !user?.id) return
    setHidingDM(true)
    try {
      await chatService.hideDMConversation(hideDMTarget._convId, user.id)
      setDmThreads(prev => prev.filter(t => t.id !== hideDMTarget.id))
      if (activeThreadId === hideDMTarget.id) setActiveThreadId(null)
      setHideDMConfirm(false)
      setHideDMTarget(null)
    } catch (err) {
      console.error('[Chat] Hide DM failed:', err)
      showToast('Could not hide conversation.', 'error')
    } finally {
      setHidingDM(false)
    }
  }

  const handleDmHeaderClick = () => {
    if (!activeThread || activeThread.type !== 'dm') return
    const other = chatUsers.find(u => u.id === activeThread.participantId)
    if (!other) return
    setDmProfileCard({ name: other.name, avatar: other.avatar, profileId: other.profileId ?? null })
  }

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSelectThread = (id) => {
    setActiveThreadId(id)
    setSendError(null)
    setIsSidebarOpen(false)
  }

  const handleSend = async (text) => {
    if (!chatCurrentUser || !activeThreadId) return

    const thread = [...jamThreads, ...dmThreads].find(t => t.id === activeThreadId)
    if (!thread?._convId) return

    setSendError(null)

    // Capture previous preview so we can roll back on failure.
    const previousLastMessage = thread.lastMessage

    // Optimistic bump: move this conversation to the top immediately so the
    // sender sees instant feedback. Subscription B will confirm with the
    // authoritative last_message_at from the DB — if they differ, the
    // realtime event wins and corrects the order.
    const optimisticTs = new Date().toISOString()
    const optimisticLast = { senderId: String(user.id), content: text, isoTimestamp: optimisticTs }
    const sortByLastMsg = (a, b) => {
      const ta = a.lastMessage?.isoTimestamp ?? ''
      const tb = b.lastMessage?.isoTimestamp ?? ''
      return tb < ta ? -1 : tb > ta ? 1 : 0
    }
    const bumpToTop = (threads) => {
      const updated = threads.map(t =>
        t.id === activeThreadId ? { ...t, lastMessage: optimisticLast } : t
      )
      return [...updated].sort(sortByLastMsg)
    }
    setDmThreads(bumpToTop)
    setJamThreads(bumpToTop)

    try {
      await chatService.sendMessage(thread._convId, user.id, text)
    } catch (err) {
      console.error('[Chat] Failed to send message:', err)
      setSendError('Message failed to send. Please try again.')
      // Roll back the optimistic preview so the sidebar doesn't show a
      // message that never sent.
      const rollback = (threads) => {
        const restored = threads.map(t =>
          t.id === activeThreadId ? { ...t, lastMessage: previousLastMessage } : t
        )
        return [...restored].sort(sortByLastMsg)
      }
      setDmThreads(rollback)
      setJamThreads(rollback)
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────
  const allThreads   = [...jamThreads, ...dmThreads]
  const activeThread = allThreads.find(t => t.id === activeThreadId)
  const messages     = messagesByThread[activeThreadId] ?? []

  // ─── Load jam attendees when switching to a jam thread ───────────────────
  // Must live AFTER activeThread is declared (activeThread is used in deps + body)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeThread?.type !== 'jam' || !activeThread.jamId) return
    const jamId = activeThread.jamId
    if (jamAttendeeCache[jamId]) return           // already cached

    Promise.all([
      jamService.getJamAttendees(jamId),
      jamService.getJamById(jamId),
    ])
      .then(([attendees, jam]) => {
        setJamAttendeeCache((prev) => ({
          ...prev,
          [jamId]: {
            adminId:   jam?.admin_id ? String(jam.admin_id) : null,
            attendees: attendees ?? [],
          },
        }))
      })
      .catch((err) => {
        console.error('[Chat] Failed to load jam attendees:', err)
      })
  }, [activeThread?.jamId, activeThread?.type]) // jamAttendeeCache excluded intentionally

  // ─── Jam role metadata derived from cache ────────────────────────────────
  const activeJamData = jamAttendeeCache[activeThread?.jamId] ?? null

  const jamParticipantMeta = useMemo(() => {
    if (!activeJamData || activeThread?.type !== 'jam') return {}
    const { adminId, attendees } = activeJamData
    return Object.fromEntries(
      attendees.map((a) => [a.userId, {
        role:     deriveRole(a),
        isHost:   a.userId === adminId,
        bringing: a.gearBringing ?? [],
      }])
    )
  }, [activeJamData, activeThread?.type])

  const headerParticipants = useMemo(() => {
    if (!activeJamData || activeThread?.type !== 'jam') return []
    const { adminId, attendees } = activeJamData
    return attendees
      .map((a) => ({
        userId: a.userId,
        name:   a.displayName,
        role:   deriveRole(a),
        isHost: a.userId === adminId,
      }))
      .sort((a, b) => (b.isHost ? 1 : 0) - (a.isHost ? 1 : 0))
  }, [activeJamData, activeThread?.type])

  const getThreadName = () => {
    if (!activeThread) return ''
    if (activeThread.type === 'jam') return `#${activeThread.name}`
    const other = chatUsers.find(u => u.id === activeThread.participantId)
    return other?.name || 'Direct Message'
  }

  // ─── Auth gate ────────────────────────────────────────────────────────────
  if (!authLoading && !isLoggedIn) {
    return (
      <div
        className="flex overflow-hidden items-center justify-center"
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="text-center px-6">
          <p
            className="text-white/50 mb-4 text-sm"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Log in to access your chats
          </p>
          <button
            type="button"
            onClick={() => openModal('login')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: '#DC2E73',
              color: '#fff',
              fontFamily: 'Sora, sans-serif',
              boxShadow: '0 0 20px rgba(220,46,115,0.25)',
            }}
          >
            Log in
          </button>
        </div>
      </div>
    )
  }

  // ─── Bootstrap / conversation loading ────────────────────────────────────
  if (authLoading || isLoadingConvs) {
    return (
      <div
        className="flex overflow-hidden items-center justify-center"
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    )
  }

  // ─── Main chat layout ────────────────────────────────────────────────────
  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={[
          'fixed lg:static z-40 lg:z-auto',
          'w-full lg:w-[280px] lg:flex-shrink-0',
          'transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ top: '4rem', bottom: 0, left: 0 }}
      >
        <ChatSidebar
          dmThreads={dmThreads}
          jamThreads={jamThreads}
          activeId={activeThreadId}
          onSelect={handleSelectThread}
          onDMHide={handleHideDM}
          users={chatUsers}
          currentUserId={chatCurrentUser?.id}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="flex items-center lg:hidden px-3 py-1.5 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={20} color="#E5E2E1" />
          </button>
        </div>

        {convError && (
          <div
            className="mx-4 mt-2 px-4 py-2 rounded-xl text-xs flex-shrink-0"
            style={{
              background: 'rgba(251,64,64,0.1)',
              color: '#fb4040',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            {convError}
          </div>
        )}

        {!activeThread && !isLoadingConvs && pendingConvId && (
          // A conversation is resolved but Stage B hasn't activated it yet
          // (threads still hydrating or being synthesised). Show a spinner
          // instead of the empty state to avoid a misleading flash.
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
          </div>
        )}

        {!activeThread && !isLoadingConvs && !pendingConvId && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 52, height: 52, background: 'rgba(220,46,115,0.08)', color: 'rgba(220,46,115,0.45)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className="text-center" style={{ maxWidth: 220 }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(229,226,225,0.55)' }}>
                {allThreads.length === 0 ? 'No conversations yet' : 'No conversation selected'}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(229,226,225,0.28)' }}>
                {allThreads.length === 0
                  ? 'Join or create a jam to start chatting with other musicians.'
                  : 'Choose a direct message or jam group from the sidebar.'}
              </p>
            </div>
          </div>
        )}

        {activeThread && (
          <>
            <ChatHeader
              thread={activeThread}
              users={chatUsers}
              participants={headerParticipants}
              onJamLinkClick={handleViewJam}
              onHeaderClick={handleHeaderClick}
              onMembersClick={activeThread.type === 'jam' ? handleHeaderClick : undefined}
              onHideDM={activeThread.type === 'dm' ? handleHideDM : undefined}
              onDmHeaderClick={activeThread.type === 'dm' ? handleDmHeaderClick : undefined}
            />

            {isLoadingMsgs ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={chatCurrentUser?.id}
                users={chatUsers}
                jamMeta={jamParticipantMeta}
              />
            )}

{sendError && (
              <p
                className="text-xs px-8 pb-1 text-center flex-shrink-0"
                style={{ color: '#fb4040', fontFamily: 'Sora, sans-serif' }}
              >
                {sendError}
              </p>
            )}

            <ChatComposer
              threadName={getThreadName()}
              onSend={handleSend}
            />
          </>
        )}
      </div>

      <EventDetailModal
        item={jamDetailModal.item}
        open={jamDetailModal.open}
        onClose={() => setJamDetailModal({ open: false, item: null })}
        viewerContext={
          jamDetailModal.item && user
            ? {
                isCreator: String(jamDetailModal.item.admin_id) === String(user.id),
                isAttendee: String(jamDetailModal.item.admin_id) !== String(user.id),
              }
            : {}
        }
        openedFrom="chat"
      />

      {attendeesModal.item && (
        <JamChatMembersModal
          open={attendeesModal.open}
          onClose={() => setAttendeesModal({ open: false, item: null })}
          item={attendeesModal.item}
          conversationId={activeThread?._convId}
          currentUserId={user?.id}
          accent="#DC2E73"
          isAdminMode={
            attendeesModal.item && user
              ? String(attendeesModal.item.admin_id) === String(user.id)
              : false
          }
          onLeaveChat={() => {
            setJamThreads(prev => prev.filter(t => t.id !== activeThreadId))
            setActiveThreadId(null)
          }}
          onLeaveJam={() => {
            setJamThreads(prev => prev.filter(t => t.id !== activeThreadId))
            setActiveThreadId(null)
          }}
        />
      )}

      <DestructiveConfirmSheet
        open={hideDMConfirm}
        onClose={() => setHideDMConfirm(false)}
        onConfirm={handleConfirmHideDM}
        loading={hidingDM}
        title="Delete Conversation?"
        body="This will remove the conversation from your list. The other person won't be affected."
        confirmLabel="Delete"
      />

      {/* ── DM profile mini-card ─────────────────────────────────────────── */}
      {dmProfileCard && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setDmProfileCard(null)}
          />
          {/* Card */}
          <div
            className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 rounded-2xl flex flex-col items-center gap-4 px-6 py-7"
            style={{
              background: 'rgba(22,22,24,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setDmProfileCard(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgba(229,226,225,0.35)' }}
              aria-label="Close"
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>

            {/* Avatar */}
            {dmProfileCard.avatar ? (
              <img
                src={dmProfileCard.avatar}
                alt={dmProfileCard.name}
                className="rounded-full object-cover"
                style={{ width: 72, height: 72, border: '2px solid rgba(255,255,255,0.1)' }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center select-none"
                style={{
                  width: 72, height: 72,
                  background: '#C2185B',
                  fontSize: 26, fontWeight: 700, color: '#fff',
                }}
              >
                {(dmProfileCard.name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()}
              </div>
            )}

            {/* Name */}
            <p className="text-[15px] font-semibold text-white text-center leading-tight">
              {dmProfileCard.name}
            </p>

            {/* View Profile button */}
            <button
              onClick={() => {
                setDmProfileCard(null)
                if (dmProfileCard.profileId) ProfilesRUS(navigate, dmProfileCard.profileId)
              }}
              disabled={!dmProfileCard.profileId}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #fb4040)', color: '#fff' }}
            >
              View Profile
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Chat