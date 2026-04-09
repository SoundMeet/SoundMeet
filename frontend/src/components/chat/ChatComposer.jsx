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
      className="flex-shrink-0 px-4 pb-4 pt-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        className="flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: '1.25rem',
          border: focused
            ? '1px solid rgba(220,46,115,0.4)'
            : '1px solid rgba(255,255,255,0.07)',
          padding: '0.5rem 0.5rem 0.5rem 1rem',
          transition: 'border-color 0.2s ease',
          boxShadow: focused ? '0 0 0 3px rgba(220,46,115,0.07)' : 'none',
        }}
      >
        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Message ${threadName || ''}…`}
          className="flex-1 bg-transparent outline-none text-sm text-[#E5E2E1]"
          style={{
            fontFamily: 'Sora, sans-serif',
            caretColor: '#DC2E73',
            minWidth: 0,
          }}
        />

        {/* Icon actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-white/10"
            style={{ width: 32, height: 32, color: 'rgba(229,226,225,0.4)' }}
            onClick={() => {}}
            aria-label="Attach file"
            tabIndex={-1}
          >
            <Paperclip size={16} />
          </button>
          <button
            className="flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-white/10"
            style={{ width: 32, height: 32, color: 'rgba(220,46,115,0.75)' }}
            aria-label="Record voice"
            tabIndex={-1}
          >
            <Mic size={17} />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          className="flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: hasText
              ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
              : 'rgba(255,255,255,0.06)',
            boxShadow: hasText ? '0 2px 12px rgba(220,46,115,0.35)' : 'none',
            flexShrink: 0,
          }}
          aria-label="Send message"
        >
          <SendHorizontal
            size={15}
            color={hasText ? '#fff' : 'rgba(229,226,225,0.35)'}
          />
        </button>
      </div>
    </div>
  )
}

export default ChatComposer
