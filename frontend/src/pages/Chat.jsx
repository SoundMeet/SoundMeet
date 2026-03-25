import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import TypingIndicator from '../components/chat/TypingIndicator'
import ChatComposer from '../components/chat/ChatComposer'
import JamInfoModal from '../components/chat/JamInfoModal'
import {
  currentUser,
  users,
  dmThreads,
  jamThreads,
  messagesByThread,
  jams,
} from '../data/chatMockData'

const allUsers = [currentUser, ...users]

const Chat = () => {
  const [activeThreadId, setActiveThreadId]   = useState('jt1')
  const [threadMessages, setThreadMessages]   = useState(messagesByThread)
  const [isTyping, setIsTyping]               = useState(false)
  const [isJamModalOpen, setIsJamModalOpen]   = useState(false)
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false)

  // Typing demo — runs once on mount
  useEffect(() => {
    const t1 = setTimeout(() => setIsTyping(true),  1200)
    const t2 = setTimeout(() => setIsTyping(false), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Derived state
  const allThreads  = [...dmThreads, ...jamThreads]
  const activeThread = allThreads.find(t => t.id === activeThreadId)
  const messages     = threadMessages[activeThreadId] || []
  const activeJam    = activeThread?.jamId ? jams[activeThread.jamId] : null

  const handleSelectThread = (id) => {
    setActiveThreadId(id)
    setIsTyping(false)
    setIsSidebarOpen(false)
  }

  const handleSend = (text) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      type: 'text',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setThreadMessages(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
    }))
  }

  const getThreadName = () => {
    if (activeThread?.type === 'jam') return `#${activeThread.name}`
    const p = users.find(u => u.id === activeThread?.participantId)
    return p?.name || ''
  }

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
          users={allUsers}
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

        <ChatHeader
          thread={activeThread}
          users={allUsers}
          onJamLinkClick={() => setIsJamModalOpen(true)}
        />

        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          users={allUsers}
        />

        <TypingIndicator
          isTyping={isTyping}
          user={users[0]}
        />

        <ChatComposer
          threadName={getThreadName()}
          onSend={handleSend}
        />
      </div>

      {/* Jam Info Modal */}
      <JamInfoModal
        jam={activeJam}
        isOpen={isJamModalOpen}
        onClose={() => setIsJamModalOpen(false)}
        users={allUsers}
      />
    </div>
  )
}

export default Chat
