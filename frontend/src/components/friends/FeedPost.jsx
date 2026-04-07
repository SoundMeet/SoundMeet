import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../../injectables/Auth'
import { PostHeader } from './PostHeader'
import { PostTextBody } from './PostTextBody'
import { PostAudioBody } from './PostAudioBody'
import { PostPhotoBody } from './PostPhotoBody'
import { PostReviewBody } from './PostReviewBody'
import { PostActions } from './PostActions'
import { CommentSection } from './CommentSection'

export function FeedPost({ post }) {
  const { user } = useAuth()
  const { author, type, postType, media, jamRef, showRef, reviewRef, location, likes, comments, hasLiked, createdAt } = post

  const isOwn = !!user && author.id === user.id

  // Local state so edits/deletes are self-contained
  const [content, setContent]         = useState(post.content)
  const [deleted, setDeleted]         = useState(false)
  const [isEditing, setIsEditing]     = useState(false)
  const [editText, setEditText]       = useState(post.content)
  const [commentsOpen, setComments]   = useState(false)
  const [commentCount] = useState(comments)
  const editRef = useRef(null)

  if (deleted) return null

  const handleEdit = () => {
    setEditText(content)
    setIsEditing(true)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  const handleEditSave = () => {
    if (editText.trim()) setContent(editText.trim())
    setIsEditing(false)
  }

  const handleEditKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') { setIsEditing(false); setEditText(content) }
  }

  const handleToggleComments = () => {
    setComments((v) => !v)
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200 hover:border-white/[0.11] hover:bg-[#1e1e1e]"
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
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
        <div className="mt-3">
          <textarea
            ref={editRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            rows={3}
            className="w-full bg-transparent text-sm leading-relaxed text-white outline-none resize-none"
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
              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditText(content) }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 hover:bg-white/10"
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
        onToggleComments={handleToggleComments}
      />

      <AnimatePresence>
        {commentsOpen && (
          <CommentSection postId={post.id} existingComments={post._rawComments ?? []} />
        )}
      </AnimatePresence>
    </div>
  )
}
