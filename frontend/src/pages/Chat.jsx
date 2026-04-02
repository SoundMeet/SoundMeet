import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import TypingIndicator from '../components/chat/TypingIndicator'
import ChatComposer from '../components/chat/ChatComposer'
import JamInfoModal from '../components/chat/JamInfoModal'
import { useAuth } from '../injectables/Auth'
import { useAuthModal } from '../context/AuthModalContext'
import { chatService } from '../injectables/chatService'
import { jamService } from '../services/jamService'

// Converts a Supabase chat_message row into the shape expected by MessageList / MessageBubble.
// All IDs are kept as-is (numbers from DB). Comparisons in MessageList use ===, so we
// normalise both senderId and currentUserId to strings to avoid type mismatches.
function normalizeMessage(row) {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    type: row.message_type ?? 'text',
    content: row.content ?? '',
    timestamp: new Date(row.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

const Chat = () => {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth()
  const { openModal } = useAuthModal()
  const location = useLocation()

  // ─── State ────────────────────────────────────────────────────────────────
  const [dmThreads, setDmThreads]           = useState([])
  const [jamThreads, setJamThreads]         = useState([])
  // Minimal user objects for chat display: current user + DM partners
  const [chatUsers, setChatUsers]           = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [messagesByThread, setMessagesByThread] = useState({})
  const [isLoadingConvs, setIsLoadingConvs] = useState(false)
  const [isLoadingMsgs, setIsLoadingMsgs]   = useState(false)
  const [convError, setConvError]           = useState(null)
  const [sendError, setSendError]           = useState(null)
  const [isJamModalOpen, setIsJamModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false)
  const [isTyping, setIsTyping]             = useState(false)

  // Realtime subscription cleanup
  const unsubRef = useRef(null)

  // ─── Current user normalised for chat components ──────────────────────────
  const chatCurrentUser = isLoggedIn && user
    ? {
        id: String(user.id),
        name: user.display_name || user.username || 'Me',
        avatar: user.pfp ?? null,
        status: 'online',
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

        // Batch-load all participant rows so we can identify DM partners
        const allParticipants = convIds.length
          ? await chatService.getParticipantsForConversations(convIds).catch(() => [])
          : []

        const dms = []
        const jams = []
        // Build a map of user_id → minimal user object for display
        const usersMap = {}

        // Seed current user into map
        if (chatCurrentUser) usersMap[chatCurrentUser.id] = chatCurrentUser

        // Enrich jam thread names from chat_jam table
        const jamConvIds = conversations.filter(c => c.jam_id).map(c => c.jam_id)
        const jamNames = jamConvIds.length
          ? await jamService.getJamNames(jamConvIds).catch(() => ({}))
          : {}

        conversations.forEach((conv) => {
          const threadId = `c_${conv.id}`
          const participants = allParticipants.filter(
            p => p.conversation_id === conv.id
          )

          if (conv.jam_id) {
            // ── Jam conversation ─────────────────────────────────────────
            jams.push({
              id: threadId,
              _convId: conv.id,
              type: 'jam',
              name: jamNames[String(conv.jam_id)] ?? `Jam #${conv.jam_id}`,
              active: false,
              memberCount: participants.length,
              onlineCount: 0,
              jamId: String(conv.jam_id),
            })
          } else {
            // ── DM conversation ──────────────────────────────────────────
            const otherParticipant = participants.find(
              p => String(p.user_id) !== String(user.id)
            )
            const otherUserId = otherParticipant
              ? String(otherParticipant.user_id)
              : null

            if (otherUserId && !usersMap[otherUserId]) {
              // Placeholder profile — TODO: enrich by calling GET /api/profiles/{id}/
              // once that endpoint is available on the Django backend.
              usersMap[otherUserId] = {
                id: otherUserId,
                name: `User #${otherUserId}`,
                avatar: null,
                status: 'offline',
              }
            }

            dms.push({
              id: threadId,
              _convId: conv.id,
              type: 'dm',
              participantId: otherUserId,
              unread: 0,
            })
          }
        })

        if (!cancelled) {
          setDmThreads(dms)
          setJamThreads(jams)
          setChatUsers(Object.values(usersMap))

          // Auto-select first thread
          const first = [...jams, ...dms][0]
          if (first) setActiveThreadId(first.id)
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
  }, [isLoggedIn, user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-open or create DM when navigated from Friends page ─────────────
  // Triggered when location.state.openDmWith is set (e.g. clicking "Chat" on
  // a friend). Runs after conversations are loaded so we can check for an
  // existing thread first before creating a new one.
  useEffect(() => {
    const target = location.state?.openDmWith
    if (!target?.id || !isLoggedIn || !user?.id || isLoadingConvs) return

    // Check if a DM thread with this user already exists in loaded threads
    const existing = dmThreads.find(
      (t) => String(t.participantId) === String(target.id)
    )

    if (existing) {
      setActiveThreadId(existing.id)
      return
    }

    // No existing thread — create one via Supabase
    chatService.getOrCreateDMChat(user.id, target.id)
      .then((convId) => {
        const threadId = `c_${convId}`
        const newThread = {
          id: threadId,
          _convId: convId,
          type: 'dm',
          participantId: String(target.id),
          unread: 0,
        }
        const newUser = {
          id: String(target.id),
          name: target.displayName || target.username || `User #${target.id}`,
          avatar: target.avatarUrl ?? null,
          status: 'offline',
        }
        setDmThreads((prev) => {
          // Guard against duplicates if the effect fires twice
          if (prev.some((t) => t.id === threadId)) return prev
          return [...prev, newThread]
        })
        setChatUsers((prev) => {
          if (prev.some((u) => u.id === newUser.id)) return prev
          return [...prev, newUser]
        })
        setActiveThreadId(threadId)
      })
      .catch((err) => {
        console.error('[Chat] Failed to open DM with friend:', err)
      })
  }, [location.state, isLoggedIn, user?.id, isLoadingConvs, dmThreads]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load messages + subscribe when active thread changes ─────────────────
  useEffect(() => {
    if (!activeThreadId || !isLoggedIn) return

    const allThreads = [...jamThreads, ...dmThreads]
    const thread = allThreads.find(t => t.id === activeThreadId)
    if (!thread?._convId) return

    // Unsubscribe from the previous thread
    unsubRef.current?.()
    unsubRef.current = null

    let cancelled = false
    setIsLoadingMsgs(true)

    chatService.getMessages(thread._convId)
      .then((rows) => {
        if (cancelled) return
        setMessagesByThread(prev => ({
          ...prev,
          [activeThreadId]: rows.map(normalizeMessage),
        }))
      })
      .catch((err) => {
        console.error('[Chat] Failed to load messages:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMsgs(false)
      })

    // Subscribe to real-time inserts — the sender also receives their own message
    // via this subscription, so we do NOT add an optimistic message on send.
    unsubRef.current = chatService.subscribeToMessages(thread._convId, (newRow) => {
      const msg = normalizeMessage(newRow)
      setMessagesByThread(prev => {
        const existing = prev[activeThreadId] ?? []
        // Guard against duplicate delivery (subscription may fire after initial fetch)
        if (existing.some(m => m.id === msg.id)) return prev
        return { ...prev, [activeThreadId]: [...existing, msg] }
      })
    })

    return () => {
      cancelled = true
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [activeThreadId, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup subscription on unmount
  useEffect(() => () => unsubRef.current?.(), [])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSelectThread = (id) => {
    setActiveThreadId(id)
    setIsTyping(false)
    setSendError(null)
    setIsSidebarOpen(false)
  }

  const handleSend = async (text) => {
    if (!chatCurrentUser || !activeThreadId) return

    const thread = [...jamThreads, ...dmThreads].find(t => t.id === activeThreadId)
    if (!thread?._convId) return

    setSendError(null)
    try {
      await chatService.sendMessage(thread._convId, user.id, text)
      // Real-time subscription delivers the message to state; no local push needed.
    } catch (err) {
      console.error('[Chat] Failed to send message:', err)
      setSendError('Message failed to send. Please try again.')
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────
  const allThreads   = [...jamThreads, ...dmThreads]
  const activeThread = allThreads.find(t => t.id === activeThreadId)
  const messages     = messagesByThread[activeThreadId] ?? []

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
        className="flex overflow-hidden bg-[#141414] items-center justify-center"
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
        className="flex overflow-hidden bg-[#141414] items-center justify-center"
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    )
  }

  // ─── Main chat layout ────────────────────────────────────────────────────
  return (
    <div
      className="flex overflow-hidden bg-[#141414]"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
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
          users={chatUsers}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Chat main area */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ backgroundColor: '#141414' }}
      >
        {/* Mobile: menu button row */}
        <div className="flex items-center lg:hidden px-3 py-1.5 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={20} color="#E5E2E1" />
          </button>
        </div>

        {/* Error banner for conversation load */}
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

        {/* No conversations yet */}
        {!activeThread && !isLoadingConvs && (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-white/30 text-sm text-center px-6"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {allThreads.length === 0
                ? 'No conversations yet.\nJoin a jam to start chatting!'
                : 'Select a conversation to get started.'}
            </p>
          </div>
        )}

        {/* Active thread view */}
        {activeThread && (
          <>
            <ChatHeader
              thread={activeThread}
              users={chatUsers}
              onJamLinkClick={() => setIsJamModalOpen(true)}
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
              />
            )}

            <TypingIndicator isTyping={isTyping} user={chatUsers[1] ?? null} />

            {/* Send error */}
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

      {/* Jam Info Modal
          TODO: populate `jam` prop with real data from chat_jam table once
          the jam detail query (name, bpm, key, description) is wired. */}
      <JamInfoModal
        jam={null}
        isOpen={isJamModalOpen}
        onClose={() => setIsJamModalOpen(false)}
        users={chatUsers}
      />
    </div>
  )
}

export default Chat
