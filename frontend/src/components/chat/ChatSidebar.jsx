import { Plus } from 'lucide-react'
import ChatSectionList from './ChatSectionList'

const ChatSidebar = ({ dmThreads, jamThreads, activeId, onSelect, users, onClose }) => {
  const handleSelect = (id) => {
    onSelect(id)
    if (onClose) onClose()
  }

  return (
    // Outer shell — full height, p-3 gives the floating-panel effect
    <div className="h-full p-3 flex flex-col" style={{ backgroundColor: 'transparent' }}>
      {/* Floating panel */}
      <div
        className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden bg-[#1C1B1B]/60"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >

        {/* "Chats" header — slightly lighter bg, rounded top */}
        <div
          className="flex-shrink-0 rounded-t-2xl p-4 bg-[#232323]/50"
          style={{
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xl text-[#E5E2E1]">Chats</span>
            <button
              onClick={() => console.log('New chat placeholder')}
              className="flex items-center justify-center rounded-full cursor-pointer hover:brightness-110 transition-all"
              style={{ width: 36, height: 36, backgroundColor: '#2A2A2A' }}
              aria-label="New chat"
            >
              <Plus size={18} color="#E5E2E1" />
            </button>
          </div>
        </div>

        {/* Pink glow separator below header */}
        <div className="h-[2px] mx-4 my-3 bg-gradient-to-r from-transparent via-[#DC2E73]/40 to-transparent flex-shrink-0" />

        {/* Scrollable list area */}
        <div className="flex-1 overflow-y-auto p-2">
          <ChatSectionList
            title="Direct Messages"
            items={dmThreads}
            activeId={activeId}
            onSelect={handleSelect}
            users={users}
          />

          {/* Whisper separator between DMs and Jam Groups */}
          <div className="mx-2 my-3 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <ChatSectionList
            title="Jam Groups"
            items={jamThreads}
            activeId={activeId}
            onSelect={handleSelect}
            users={users}
          />
        </div>

      </div>
    </div>
  )
}

export default ChatSidebar
