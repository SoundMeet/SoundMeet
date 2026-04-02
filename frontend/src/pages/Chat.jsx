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
function normalizeMessage(row) {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    type: 'text',
    content: row.content ?? '',
    timestamp: new Date(row.timestamp).toLocaleTimeString([], {
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

        const allParticipants = convIds.length
          ? await chatService.getParticipantsForConversations(convIds).catch(() => [])
          : []

        const dms = []
        const jams = []
        const usersMap = {}
        const missingUserIds = new Set()

        if (chatCurrentUser) usersMap[chatCurrentUser.id] = chatCurrentUser

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
            const otherParticipant = participants.find(
              p => String(p.user_id) !== String(user.id)
            )
            const otherUserId = otherParticipant
              ? String(otherParticipant.user_id)
              : null

            if (otherUserId && !usersMap[otherUserId]) {
              missingUserIds.add(otherUserId) // Mark this user for fetching
              usersMap[otherUserId] = {
                id: otherUserId,
                name: `Loading...`, 
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
                avatar: profile.pfp || null,
                status: 'offline'
              }
            })
          } catch (err) {
            console.error('[Chat] Error fetching profiles from database:', err)
          }
        }

        if (!cancelled) {
          setDmThreads(dms)
          setJamThreads(jams)
          setChatUsers(Object.values(usersMap))

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


  // ─── Auto-open or create DM when navigated from Friends page ─────────────
  useEffect(() => {
    const target = location.state?.openDmWith
    if (!target?.id || !isLoggedIn || !user?.id || isLoadingConvs) return

    const existing = dmThreads.find(
      (t) => String(t.participantId) === String(target.id)
    )

    if (existing) {
      setActiveThreadId(existing.id)
      return
    }

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
  }, [location.state, isLoggedIn, user?.id, isLoadingConvs, dmThreads])

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

    unsubRef.current = chatService.subscribeToMessages(thread._convId, (newRow) => {
      const msg = normalizeMessage(newRow)
      setMessagesByThread(prev => {
        const existing = prev[activeThreadId] ?? []
        if (existing.some(m => m.id === msg.id)) return prev
        return { ...prev, [activeThreadId]: [...existing, msg] }
      })
    })

    return () => {
      cancelled = true
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [activeThreadId, isLoggedIn]) 

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
          users={chatUsers}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ backgroundColor: '#141414' }}
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