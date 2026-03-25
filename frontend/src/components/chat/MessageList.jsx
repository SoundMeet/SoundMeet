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
      className="flex-1 overflow-y-auto px-6 py-4"
      style={{ backgroundColor: '#141414' }}
    >
      {groups.map((group, gi) => {
        const isOutgoing = group.senderId === currentUserId
        const sender = (users || []).find(u => u.id === group.senderId)

        return (
          <div key={gi} className="mb-6">
            {group.messages.map((msg, mi) => {
              const props = {
                message: msg,
                isOutgoing,
                showSenderInfo: mi === 0,
                sender,
              }
              return (
                <div key={msg.id} className={mi > 0 ? 'mt-1' : ''}>
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
