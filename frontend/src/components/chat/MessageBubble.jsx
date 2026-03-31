const MessageBubble = ({ message, isOutgoing, showSenderInfo, sender }) => {
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'items-end gap-2'}`}>
      {/* Incoming avatar column */}
      {!isOutgoing && (
        <div style={{ width: 36, flexShrink: 0 }}>
          {showSenderInfo && (
            <img
              src={sender?.avatar}
              alt={sender?.name}
              className="rounded-full object-cover"
              style={{ width: 36, height: 36 }}
            />
          )}
        </div>
      )}

      {/* Bubble column */}
      <div
        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: '70%' }}
      >
        {showSenderInfo && !isOutgoing && sender && (
          <div
            className="mb-1"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(229,226,225,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {sender.name}
          </div>
        )}

        <div className="group">
          <div
            className="text-sm text-[#E5E2E1]"
            style={{
              background: isOutgoing
                ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                : '#2A2A2A',
              borderRadius: '1.5rem',
              padding: '0.75rem 1rem',
            }}
          >
            {message.content}
          </div>
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(229,226,225,0.7)',
              textAlign: isOutgoing ? 'right' : 'left',
            }}
          >
            {message.timestamp}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
