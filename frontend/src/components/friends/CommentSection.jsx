import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSend } from 'react-icons/md'
import { useAuth } from '../../injectables/Auth'

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function Comment({ comment, canDelete, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group flex gap-2.5"
    >
      {/* Avatar */}
      {comment.author.avatarUrl ? (
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.displayName}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
          style={{ background: '#222' }}
        />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, rgba(220,46,115,0.5), rgba(251,64,64,0.3))' }}
        >
          {comment.author.displayName?.[0]}
        </div>
      )}

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div
          className="inline-block px-3 py-2 rounded-2xl rounded-tl-sm max-w-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <span className="text-[11px] font-semibold text-white mr-1.5">
            {comment.author.displayName}
          </span>
          <span className="text-[12px] leading-relaxed" style={{ color: 'rgba(229,226,225,0.8)' }}>
            {comment.content}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 pl-1">
          <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
            {timeAgo(comment.createdAt)}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-[10px] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-150 hover:text-red-400"
              style={{ color: 'rgba(229,226,225,0.3)' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function CommentSection({ comments = [], currentUserId, onAdd, onDelete }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const canSubmit = text.trim().length > 0

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const body = text.trim()
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onAdd(body)
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="overflow-hidden"
    >
      <div
        className="mt-3 pt-3 flex flex-col gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Comment list */}
        {comments.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  canDelete={!!currentUserId && c.author.id === currentUserId}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2.5">
          {/* Own avatar */}
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, rgba(220,46,115,0.5), rgba(251,64,64,0.3))' }}
          >
            {(user?.display_name ?? user?.username ?? 'Y')?.[0]}
          </div>

          <div
            className="flex-1 flex items-end gap-2 px-3 py-2 rounded-2xl transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${text ? 'rgba(220,46,115,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment…"
              rows={1}
              className="flex-1 bg-transparent text-base sm:text-[12px] leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
              style={{ caretColor: '#DC2E73', maxHeight: 80, overflow: 'auto' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-shrink-0 w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-all duration-150 hover:brightness-110 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                background: canSubmit ? 'linear-gradient(135deg, #DC2E73, #FB4040)' : 'transparent',
                color: canSubmit ? '#fff' : 'rgba(229,226,225,0.3)',
              }}
            >
              <MdSend className="text-sm sm:text-xs" />
            </button>
          </div>
        </div>

        <p className="hidden sm:block text-[10px] pl-10" style={{ color: 'rgba(229,226,225,0.2)' }}>
          Enter to post · Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  )
}
