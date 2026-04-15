import { useState } from 'react'
import { MdFavoriteBorder, MdFavorite, MdChatBubbleOutline } from 'react-icons/md'
import { postService } from '../../injectables/postService'

export function PostActions({ postId, userId, likes, comments, hasLiked, commentsOpen, onToggleComments }) {
  const [liked, setLiked]         = useState(hasLiked)
  const [likeCount, setLikeCount] = useState(likes)

  const toggleLike = async () => {
    setLiked((v) => !v)
    setLikeCount((c) => (liked ? c - 1 : c + 1))
    try {
      await postService.toggleLike(postId, userId, liked)
    } catch (err) {
      setLiked(liked)
      setLikeCount(likeCount)
      console.error('toggleLike failed:', err)
    }
  }

  return (
    <div
      className="flex items-center gap-0.5 mt-3.5 pt-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Like */}
      <button
        onClick={toggleLike}
        className="group flex items-center gap-1.5 px-3 py-3.5 sm:py-1.5 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-white/[0.05] active:scale-95"
        style={{ color: liked ? '#DC2E73' : 'rgba(229,226,225,0.42)' }}
        aria-label="Like"
      >
        {liked
          ? <MdFavorite className="text-[15px] transition-transform duration-100 scale-110" />
          : <MdFavoriteBorder className="text-[15px] transition-transform duration-100 group-hover:scale-110" />
        }
        <span className="tabular-nums">{likeCount}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onToggleComments}
        className="flex items-center gap-1.5 px-3 py-3.5 sm:py-1.5 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95"
        style={{
          color: commentsOpen ? '#A78BFA' : 'rgba(229,226,225,0.42)',
          background: commentsOpen ? 'rgba(167,139,250,0.08)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!commentsOpen) {
            e.currentTarget.style.background = 'rgba(167,139,250,0.06)'
            e.currentTarget.style.color = 'rgba(167,139,250,0.8)'
          }
        }}
        onMouseLeave={(e) => {
          if (!commentsOpen) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(229,226,225,0.42)'
          }
        }}
        aria-label="Comment"
      >
        <MdChatBubbleOutline className="text-[15px]" />
        <span className="tabular-nums">{comments}</span>
      </button>
    </div>
  )
}
