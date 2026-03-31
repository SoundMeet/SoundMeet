import { useState } from 'react'
import { Paperclip, Mic, SendHorizontal } from 'lucide-react'

const ChatComposer = ({ threadName, onSend }) => {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const hasText = input.trim().length > 0

  const handleSend = () => {
    if (!hasText) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-4 flex-shrink-0 rounded-2xl mx-4 mb-4 bg-[#1C1B1B]/60"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Pill input */}
      <div
        className="flex items-center gap-2 flex-1 px-4 py-3"
        style={{
          backgroundColor: '#2A2A2A',
          borderRadius: '3rem',
          boxShadow: focused
            ? '0 0 0 1px rgba(220,46,115,0.5)'
            : '0 0 0 1px rgba(220,46,115,0.0)',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Message ${threadName || ''}…`}
          className="flex-1 bg-transparent outline-none text-sm text-[#E5E2E1] placeholder:text-[rgba(229,226,225,0.4)]"
        />
        <button
          className="cursor-pointer transition-colors hover:text-[#E5E2E1]"
          style={{ color: 'rgba(229,226,225,0.7)', flexShrink: 0 }}
          onClick={() => {}}
          aria-label="Attach file"
          tabIndex={-1}
        >
          <Paperclip size={20} />
        </button>
        <button
          className="cursor-pointer flex-shrink-0"
          style={{ color: '#DC2E73' }}
          aria-label="Record voice"
          tabIndex={-1}
        >
          <Mic size={20} />
        </button>
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition-all duration-200"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: hasText
            ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
            : '#2A2A2A',
        }}
        aria-label="Send message"
      >
        <SendHorizontal
          size={18}
          color={hasText ? 'white' : 'rgba(229,226,225,0.7)'}
        />
      </button>
    </div>
  )
}

export default ChatComposer
