import ChatListItem from './ChatListItem'

const ChatSectionList = ({ title, items, activeId, onSelect, users }) => {
  return (
    <div className="mb-2">
      <div
        className="px-4 mt-2 mb-3"
        style={{
          fontSize: '0.75rem',
          color: 'rgba(229,226,225,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </div>
      {items.map(item => (
        <ChatListItem
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          onClick={() => onSelect(item.id)}
          users={users}
        />
      ))}
    </div>
  )
}

export default ChatSectionList
