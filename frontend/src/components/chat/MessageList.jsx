import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import AudioMessageBubble from './AudioMessageBubble'

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ rawDate }) {
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  let label
  if (rawDate === today) {
    label = 'Today'
  } else if (rawDate === yesterday) {
    label = 'Yesterday'
  } else {
    const d = new Date(rawDate)
    label = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex items-center gap-3 my-4" aria-label={label}>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span
        style={{
          fontSize:      '0.62rem',
          color:         'rgba(229,226,225,0.3)',
          letterSpacing: '0.04em',
          fontWeight:    500,
          whiteSpace:    'nowrap',
        }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// jamMeta: { [userId]: { role: string|null, isHost: boolean, bringing: string[] } }
const MessageList = ({ messages, currentUserId, users, jamMeta }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group consecutive messages by same sender AND same date
  const groups = []
  messages.forEach((msg) => {
    const last = groups[groups.length - 1]
    if (last && last.senderId === msg.senderId && last.rawDate === (msg.rawDate ?? '')) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.senderId, rawDate: msg.rawDate ?? '', messages: [msg] })
    }
  })

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        padding:       '20px 24px 8px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}
    >
      {groups.map((group, gi) => {
        const isOutgoing    = group.senderId === currentUserId
        const sender        = (users || []).find((u) => u.id === group.senderId)
        const count         = group.messages.length
        const senderJamMeta = jamMeta?.[group.senderId] ?? null
        // Show date separator when date changes (or on first group)
        const prevGroup     = groups[gi - 1]
        const showDate      = gi === 0 || prevGroup.rawDate !== group.rawDate

        return (
          <div key={gi} className={gi < groups.length - 1 ? 'mb-4' : 'mb-2'}>
            {showDate && group.rawDate && (
              <DateSeparator rawDate={group.rawDate} />
            )}
            {group.messages.map((msg, mi) => {
              const props = {
                message:        msg,
                isOutgoing,
                showSenderInfo: mi === 0,
                sender,
                isFirst:        mi === 0,
                isLast:         mi === count - 1,
                jamMeta:        senderJamMeta,
              }
              return (
                <div key={msg.id} className={mi > 0 ? 'mt-0.5' : ''}>
                  {msg.type === 'audio'
                    ? <AudioMessageBubble {...props} />
                    : <MessageBubble {...props} />
                  }
                </div>
              )
            })}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
