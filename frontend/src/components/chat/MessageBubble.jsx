// isFirst / isLast refer to position within the sender group — used to shape border-radius
const MessageBubble = ({ message, isOutgoing, showSenderInfo, sender, isFirst, isLast }) => {
  const R = 18  // base corner radius
  const r = 5   // tight corner for grouped messages

  // Shape bubbles into a cluster: shared flat edge on the "avatar side"
  const borderRadius = isOutgoing
    ? `${R}px ${isFirst ? R : r}px ${isLast ? R : r}px ${R}px`
    : `${isFirst ? R : r}px ${R}px ${R}px ${isLast ? R : r}px`

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'items-end gap-2.5'}`}>
      {/* Incoming avatar column — reserve space so bubbles stay aligned */}
      {!isOutgoing && (
        <div style={{ width: 32, flexShrink: 0 }}>
          {showSenderInfo && (
            <img
              src={sender?.avatar}
              alt={sender?.name}
              className="rounded-full object-cover"
              style={{ width: 32, height: 32 }}
            />
          )}
        </div>
      )}

      {/* Bubble column */}
      <div
        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: '68%' }}
      >
        {/* Sender name above first incoming message */}
        {showSenderInfo && !isOutgoing && sender && (
          <div
            className="mb-1 ml-1"
            style={{
              fontSize: '0.68rem',
              color: 'rgba(229,226,225,0.5)',
              letterSpacing: '0.03em',
            }}
          >
            {sender.name}
          </div>
        )}

        <div className="group">
          <div
            className="text-sm leading-relaxed"
            style={{
              background: isOutgoing
                ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                : 'rgba(255,255,255,0.07)',
              color: isOutgoing ? '#fff' : '#E5E2E1',
              borderRadius,
              padding: '0.55rem 0.9rem',
              wordBreak: 'break-word',
              border: isOutgoing ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {message.content}
          </div>
          {/* Timestamp on hover */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-0.5 px-1"
            style={{
              fontSize: '0.65rem',
              color: 'rgba(229,226,225,0.35)',
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
