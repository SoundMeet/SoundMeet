import { useState, useRef, useEffect } from 'react'
import { Music, SendHorizontal, Smile } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { extractEventLink } from '../../utils/eventLinkParser'
import { EventInviteCard } from '../event-invite/EventInviteCard'
import { JamPickerSheet } from './JamPickerSheet'

// Small X icon for the dismiss button
const DismissIcon = () => (
  <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
)

const ChatComposer = ({ threadName, onSend }) => {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  // Track which specific event link has been dismissed so the user can freely edit
  // text around the link without the preview instantly re-appearing.
  const [dismissedLink, setDismissedLink] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showJamPicker, setShowJamPicker] = useState(false)
  const emojiPickerRef = useRef(null)
  const emojiButtonRef = useRef(null)

  const hasText = input.trim().length > 0

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  // Derive event link from current input on every render (cheap string match)
  const detectedLink = extractEventLink(input)
  const showPreview  = !!detectedLink &&
    !(dismissedLink?.type === detectedLink?.type && dismissedLink?.id === detectedLink?.id)

  const handleChange = (e) => {
    const val = e.target.value
    setInput(val)
    // If the input no longer contains the previously dismissed link, clear the dismiss state
    // so a newly pasted URL shows a fresh preview.
    if (dismissedLink) {
      const still = extractEventLink(val)
      if (!still || still.type !== dismissedLink.type || still.id !== dismissedLink.id) {
        setDismissedLink(null)
      }
    }
  }

  const handleDismissPreview = () => {
    setDismissedLink(detectedLink)
  }

  const handleSend = () => {
    if (!hasText) return
    onSend(input.trim())
    setInput('')
    setDismissedLink(null)
    setShowEmojiPicker(false)
  }

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleJamSelect = (jamId) => {
    const link = `/jam/${jamId}`
    setInput((prev) => (prev ? `${prev} ${link}` : link))
    setShowJamPicker(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex-shrink-0 px-4 pt-3"
      style={{
        position: 'relative',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Event invite preview — appears above the input row when a link is detected */}
      {showPreview && (
        <div className="relative mb-2">
          <EventInviteCard
            type={detectedLink.type}
            id={detectedLink.id}
            compact={true}
            previewOnly={true}
          />
          <button
            onClick={handleDismissPreview}
            aria-label="Remove event preview"
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/20"
            style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(229,226,225,0.8)' }}
          >
            <DismissIcon />
          </button>
        </div>
      )}

      {/* Emoji picker popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="emoji-picker-wrapper"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            zIndex: 50,
          }}
        >
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            searchDisabled={false}
            skinTonesDisabled
            width={320}
            height={380}
            previewConfig={{ showPreview: false }}
            style={{
              '--epr-bg-color': '#1a1a1a',
              '--epr-category-label-bg-color': '#1a1a1a',
              '--epr-hover-bg-color': 'rgba(220,46,115,0.15)',
              '--epr-search-input-bg-color': 'rgba(255,255,255,0.07)',
              '--epr-text-color': '#E5E2E1',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>
      )}

      {/* Jam picker sheet */}
      <JamPickerSheet
        open={showJamPicker}
        onClose={() => setShowJamPicker(false)}
        onSelectJam={handleJamSelect}
      />

      {/* Input row */}
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
          onChange={handleChange}
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

        {/* Emoji picker toggle */}
        <button
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker((v) => !v)}
          className="flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-white/10 flex-shrink-0"
          style={{ width: 32, height: 32, color: showEmojiPicker ? '#DC2E73' : 'rgba(229,226,225,0.35)' }}
          aria-label="Emoji picker"
          tabIndex={-1}
        >
          <Smile size={16} />
        </button>

        {/* Jam invite picker toggle */}
        <button
          onClick={() => setShowJamPicker(true)}
          className="flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-white/10 flex-shrink-0"
          style={{ width: 32, height: 32, color: showJamPicker ? '#DC2E73' : 'rgba(229,226,225,0.35)' }}
          aria-label="Send jam invite"
          tabIndex={-1}
        >
          <Music size={16} />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          className="flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 rounded-full w-11 h-11 md:w-[34px] md:h-[34px]"
          style={{
            background: hasText
              ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
              : 'rgba(255,255,255,0.06)',
            boxShadow: hasText ? '0 2px 12px rgba(220,46,115,0.35)' : 'none',
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
