import { useState } from 'react'
import { Plus } from 'lucide-react'
import ChatSectionList from './ChatSectionList'
import { NewChatModal } from './NewChatModal'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ChatSidebar = ({ dmThreads, jamThreads, activeId, onSelect, users, onClose }) => {
  const [query, setQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)

  const q = query.trim().toLowerCase()

  const filteredDms = q
    ? dmThreads.filter((t) => {
        const user = (users || []).find((u) => u.id === t.participantId)
        return user?.name?.toLowerCase().includes(q)
      })
    : dmThreads

  const filteredJams = q
    ? jamThreads.filter((t) => t.name?.toLowerCase().includes(q))
    : jamThreads

  const handleSelect = (id) => {
    onSelect(id)
    if (onClose) onClose()
  }

  return (
    <div className="h-full p-3 flex flex-col" style={{ backgroundColor: 'transparent' }}>
      <NewChatModal open={newChatOpen} onOpenChange={setNewChatOpen} />
      {/* Floating panel */}
      <div
        className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/10"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg text-[#E5E2E1]" style={{ fontFamily: 'Sora, sans-serif' }}>
              Chats
            </span>
            <button
              onClick={() => setNewChatOpen(true)}
              className="flex items-center justify-center rounded-xl cursor-pointer transition-colors hover:bg-white/10"
              style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.06)' }}
              aria-label="New chat"
            >
              <Plus size={14} color="rgba(229,226,225,0.7)" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative flex items-center">
            <span
              className="absolute left-3 pointer-events-none"
              style={{ color: 'rgba(229,226,225,0.3)' }}
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full pl-8 pr-3 rounded-xl text-[13px] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#E5E2E1',
                fontFamily: 'Sora, sans-serif',
                caretColor: '#DC2E73',
                padding: '7px 12px 7px 30px',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(220,46,115,0.3)'
                e.target.style.background = 'rgba(255,255,255,0.07)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255,255,255,0.06)'
                e.target.style.background = 'rgba(255,255,255,0.05)'
              }}
            />
          </div>
        </div>

        {/* Subtle divider */}
        <div className="h-px mx-4 bg-white/[0.06] flex-shrink-0" />

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          <ChatSectionList
            title="Direct Messages"
            items={filteredDms}
            activeId={activeId}
            onSelect={handleSelect}
            users={users}
          />

          <div className="mx-3 my-2 h-px bg-white/[0.06]" />

          <ChatSectionList
            title="Jam Groups"
            items={filteredJams}
            activeId={activeId}
            onSelect={handleSelect}
            users={users}
            showEmptyState
          />
        </div>

      </div>
    </div>
  )
}

export default ChatSidebar
