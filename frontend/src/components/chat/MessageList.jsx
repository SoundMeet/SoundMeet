import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import AudioMessageBubble from './AudioMessageBubble'

const MessageList = ({ messages, currentUserId, users }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group consecutive messages by same sender
  const groups = []
  messages.forEach((msg) => {
    const last = groups[groups.length - 1]
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.senderId, messages: [msg] })
    }
  })

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        backgroundColor: '#141414',
        padding: '20px 24px 8px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}
    >
      {groups.map((group, gi) => {
        const isOutgoing = group.senderId === currentUserId
        const sender = (users || []).find((u) => u.id === group.senderId)
        const count = group.messages.length

        return (
          <div key={gi} className={gi < groups.length - 1 ? 'mb-4' : 'mb-2'}>
            {group.messages.map((msg, mi) => {
              const props = {
                message: msg,
                isOutgoing,
                showSenderInfo: mi === 0,
                sender,
                isFirst: mi === 0,
                isLast: mi === count - 1,
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
