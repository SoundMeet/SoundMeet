import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../../injectables/Auth'
import { postService } from '../../injectables/postService'
import { useToast } from '../../context/ToastContext'
import { formatAvatarUrl } from '../../utils/formatAvatarUrl'
import { PostHeader } from './PostHeader'
import { PostTextBody } from './PostTextBody'
import { PostAudioBody } from './PostAudioBody'
import { PostPhotoBody } from './PostPhotoBody'
import { PostReviewBody } from './PostReviewBody'
import { PostActions } from './PostActions'
import { CommentSection } from './CommentSection'

// Subtle top-border accent per post type — gives each card a quiet musical identity
const TYPE_TOP_COLOR = {
  jam:    'rgba(220,46,115,0.38)',
  clip:   'rgba(167,139,250,0.38)',
  show:   'rgba(252,211,77,0.38)',
  gear:   'rgba(52,211,153,0.38)',
  review: 'rgba(251,146,60,0.38)',
}

function normalizeComment(c) {
  if (!c) return null
  const profile = c.author?.chat_profile?.[0] ?? c.author?.chat_profile ?? null
  return {
    id:        c.id ?? `unknown-${Math.random()}`,
    author: {
      id:          c.author?.id ?? null,
      displayName: profile?.display_name ?? c.author?.username ?? 'Unknown',
      avatarUrl:   profile?.pfp ? formatAvatarUrl(profile.pfp) : null,
    },
    content:   c.content ?? '',
    createdAt: c.created_at ?? null,
  }
}

export function FeedPost({ post }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { author, type, postType, media, jamRef, showRef, reviewRef, location, likes, comments, hasLiked, createdAt } = post

  const isOwn = !!user && author.id === user.id

  const [content, setContent]             = useState(post.content)
  const [deleted, setDeleted]             = useState(false)
  const [isEditing, setIsEditing]         = useState(false)
  const [editText, setEditText]           = useState(post.content)
  const [commentsOpen, setComments]       = useState(false)
  const [commentCount, setCommentCount]   = useState(comments)
  const [localComments, setLocalComments] = useState(
    () => (post._rawComments ?? []).map(normalizeComment).filter(Boolean)
  )
  const editRef = useRef(null)

  if (deleted) return null

  const handleEdit = () => {
    setEditText(content)
    setIsEditing(true)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  const handleEditSave = async () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === content) { setIsEditing(false); return }
    const prev = content
    setContent(trimmed)
    setIsEditing(false)
    try {
      await postService.updatePost(post.id, trimmed)
    } catch (err) {
      console.error('edit post failed:', err)
      setContent(prev)
      showToast('Failed to save edit. Please try again.', 'error')
    }
  }

  const handleEditKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') { setIsEditing(false); setEditText(content) }
  }

  const handleAddComment = async (content) => {
    if (!user?.id) return
    const optimistic = {
      id:        `opt-${Date.now()}`,
      author: {
        id:          user.id,
        displayName: user.display_name ?? user.username ?? 'You',
        avatarUrl:   formatAvatarUrl(user.pfp),
      },
      content,
      createdAt: new Date().toISOString(),
    }
    setLocalComments((prev) => [...prev, optimistic])
    try {
      const saved = await postService.addComment(post.id, content)
      const confirmed = {
        id:        saved?.id ?? optimistic.id,
        author:    optimistic.author,
        content:   saved?.content ?? content,
        createdAt: saved?.created_at ?? optimistic.createdAt,
      }
      setLocalComments((prev) => prev.map((c) => c.id === optimistic.id ? confirmed : c))
      setCommentCount((c) => c + 1)
    } catch (err) {
      console.error('addComment failed:', err)
      setLocalComments((prev) => prev.filter((c) => c.id !== optimistic.id))
    }
  }

  const handleDeleteComment = (id) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== id))
    setCommentCount((c) => Math.max(0, c - 1))
  }

  const topBorderColor = TYPE_TOP_COLOR[postType] ?? 'rgba(255,255,255,0.06)'

  return (
    <div
      className="rounded-2xl transition-all duration-200 px-3 pt-3 pb-2.5 sm:px-[18px] sm:pt-[18px] sm:pb-[14px]"
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTopColor: topBorderColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(255,255,255,0.11)`
        e.currentTarget.style.borderTopColor = topBorderColor
        e.currentTarget.style.background = '#1d1d1d'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.28)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderTopColor = topBorderColor
        e.currentTarget.style.background = '#1a1a1a'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <PostHeader
        author={author}
        createdAt={createdAt}
        location={location}
        postType={postType}
        isOwn={isOwn}
        onEdit={handleEdit}
        onDelete={() => setDeleted(true)}
      />

      {/* Body */}
      {isEditing ? (
        <div className="mt-3.5">
          <textarea
            ref={editRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            rows={3}
            className="w-full bg-transparent text-base sm:text-sm leading-relaxed text-white outline-none resize-none"
            style={{
              caretColor: '#DC2E73',
              border: '1px solid rgba(220,46,115,0.3)',
              borderRadius: 10,
              padding: '8px 12px',
              background: 'rgba(220,46,115,0.04)',
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEditSave}
              className="px-3 py-3 sm:py-1 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditText(content) }}
              className="px-3 py-3 sm:py-1 rounded-full text-xs font-semibold transition-all duration-150 hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.5)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {type === 'text'  && postType !== 'review' && <PostTextBody   content={content} jamRef={jamRef} showRef={showRef} />}
          {type === 'audio' && <PostAudioBody content={content} media={media}   jamRef={jamRef} />}
          {type === 'photo' && <PostPhotoBody content={content} media={media}   jamRef={jamRef} />}
          {postType === 'review' && <PostReviewBody content={content} jamRef={jamRef} reviewRef={reviewRef} />}
        </>
      )}

      <PostActions
        postId={post.id}
        userId={user?.id}
        likes={likes}
        comments={commentCount}
        hasLiked={hasLiked}
        commentsOpen={commentsOpen}
        onToggleComments={() => setComments((v) => !v)}
      />

      <AnimatePresence>
        {commentsOpen && (
          <CommentSection
            comments={localComments}
            currentUserId={user?.id}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
