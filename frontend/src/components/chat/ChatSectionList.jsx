import ChatListItem from './ChatListItem'

function EmptyJamState() {
  return (
    <div
      className="mx-2 my-2 flex flex-col items-center justify-center gap-1.5 rounded-xl py-5"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(229,226,225,0.2)' }} aria-hidden="true">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <span style={{ fontSize: '0.7rem', color: 'rgba(229,226,225,0.25)', letterSpacing: '0.01em' }}>
        No jam group chats yet
      </span>
    </div>
  )
}

const ChatSectionList = ({ title, items, activeId, onSelect, users, showEmptyState = false }) => {
  return (
    <div className="mb-1">
      <div
        className="px-3 pt-2.5 pb-1.5"
        style={{
          fontSize: '0.62rem',
          color: 'rgba(229,226,225,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {items.length === 0 && showEmptyState
        ? <EmptyJamState />
        : items.map((item) => (
            <ChatListItem
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              onClick={() => onSelect(item.id)}
              users={users}
            />
          ))
      }
    </div>
  )
}

export default ChatSectionList
