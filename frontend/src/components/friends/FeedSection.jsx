import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSearch, MdMusicNote, MdHeadphones, MdStars, MdPhotoCamera, MdClose, MdStar } from 'react-icons/md'
import { postService } from '../../injectables/postService'
import { formatAvatarUrl } from '../../utils/formatAvatarUrl'
import { useAuth } from '../../injectables/Auth'
import { FeedPost } from './FeedPost'
import { PostComposerModal } from './composer/PostComposerModal'
import { ClipComposerBody } from './composer/ClipComposerBody'
import { JamInviteComposerBody } from './composer/JamInviteComposerBody'
import { ShowPromoComposerBody } from './composer/ShowPromoComposerBody'
import { PhotoComposerBody } from './composer/PhotoComposerBody'
import { ReviewComposerBody } from './composer/ReviewComposerBody'

// ─── Filter / search ──────────────────────────────────────────────────────────

const FILTER_PILLS = [
  { key: 'all',    label: 'All'     },
  { key: 'jam',    label: 'Jams'    },
  { key: 'clip',   label: 'Clips'   },
  { key: 'show',   label: 'Shows'   },
  { key: 'gear',   label: 'Gear'    },
  { key: 'review', label: 'Reviews' },
]

function matchesFilter(post, filter) {
  return filter === 'all' || post.postType === filter
}

function matchesSearch(post, query) {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    post.content.toLowerCase().includes(q) ||
    post.author.displayName.toLowerCase().includes(q) ||
    post.author.username.toLowerCase().includes(q) ||
    post.tags.some((t) => t.toLowerCase().includes(q)) ||
    (post.jamRef?.title ?? '').toLowerCase().includes(q)
  )
}

// ─── Composer config ──────────────────────────────────────────────────────────

const COMPOSER_CONFIG = {
  clip: {
    title:       'Post a Clip',
    accent:      '#A78BFA',
    submitLabel: 'Post Clip',
    initState:   () => ({ caption: '', audioFile: null }),
  },
  jam: {
    title:       'Invite to Jam',
    accent:      '#DC2E73',
    submitLabel: 'Send Invite',
    initState:   () => ({ message: '', selectedJam: null }),
  },
  show: {
    title:       'Promote a Show',
    accent:      '#F7C10D',
    submitLabel: 'Promote Show',
    initState:   () => ({ caption: '', selectedShow: null }),
  },
  photo: {
    title:       'Share Photos',
    accent:      '#34D399',
    submitLabel: 'Share Photos',
    initState:   () => ({ caption: '', photos: [] }),
  },
  review: {
    title:       'Write a Review',
    accent:      '#FB923C',
    submitLabel: 'Post Review',
    initState:   () => ({ caption: '', selectedJam: null, rating: 0 }),
  },
}

// ─── Char counter SVG (Twitter-style ring) ────────────────────────────────────

const MAX_CHARS = 300

function CharCounter({ length }) {
  const r = 11
  const circ = 2 * Math.PI * r
  const pct = Math.min(length / MAX_CHARS, 1)
  const offset = circ * (1 - pct)
  const color = pct >= 1 ? '#FB4040' : pct > 0.85 ? '#FCD34D' : '#DC2E73'
  const remaining = MAX_CHARS - length
  const showNum = remaining <= 30

  return (
    <div className="relative w-7 h-7 flex items-center justify-center flex-shrink-0">
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.2s' }}
        />
      </svg>
      {showNum && (
        <span
          className="absolute text-[9px] font-bold tabular-nums"
          style={{ color, transform: 'rotate(0deg)' }}
        >
          {remaining < 0 ? remaining : remaining}
        </span>
      )}
    </div>
  )
}

// ─── PostComposer (inline Twitter-style) ──────────────────────────────────────

const ATTACH_BUTTONS = [
  { key: 'clip',   icon: MdHeadphones,  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Post Clip'     },
  { key: 'jam',    icon: MdMusicNote,   color: '#DC2E73', bg: 'rgba(220,46,115,0.12)',  label: 'Invite to Jam' },
  { key: 'show',   icon: MdStars,       color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  label: 'Promote Show'  },
  { key: 'photo',  icon: MdPhotoCamera, color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'Share Photo'   },
  { key: 'review', icon: MdStar,        color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  label: 'Review a Jam'  },
]

function PostComposer({ author, onOpen, onPost }) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const containerRef = useRef(null)
  const canPost = text.trim().length > 0 && text.length <= MAX_CHARS

  // Auto-grow textarea
  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Focus textarea when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => {
        textareaRef.current?.focus()
        autoResize()
      }, 50)
    }
  }, [expanded])

  // Click outside to collapse
  useEffect(() => {
    if (!expanded) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (!text.trim()) {
          setExpanded(false)
          setText('')
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded, text])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setExpanded(false); setText('') }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPost) handlePost()
  }

  const handlePost = () => {
    if (!canPost) return
    onPost(text.trim())
    setText('')
    setExpanded(false)
  }

  const handleAttach = (key) => {
    // Pre-fill the message with current typed text
    onOpen(key, text.trim())
    setText('')
    setExpanded(false)
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl transition-all duration-200"
      style={{
        background: '#1a1a1a',
        border: `1px solid ${expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: expanded ? '0 0 0 3px rgba(220,46,115,0.06)' : 'none',
      }}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 pt-0.5">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, rgba(220,46,115,0.4), rgba(251,64,64,0.25))' }}
              >
                {author.displayName?.[0]}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex-1 min-w-0">
            {/* Collapsed placeholder */}
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full text-left py-2 text-sm transition-colors duration-150"
                style={{ color: 'rgba(229,226,225,0.28)' }}
              >
                Share something with friends…
              </button>
            )}

            {/* Expanded textarea */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => { setText(e.target.value); autoResize() }}
                    onKeyDown={handleKeyDown}
                    placeholder="Share something with friends…"
                    rows={2}
                    className="w-full bg-transparent text-sm leading-relaxed text-white outline-none resize-none placeholder:text-white/25"
                    style={{
                      caretColor: '#DC2E73',
                      minHeight: 52,
                      overflow: 'hidden',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Collapsed: action pills */}
      {!expanded && (
        <div
          className="px-4 pb-4 flex items-center gap-2 flex-wrap"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}
        >
          {ATTACH_BUTTONS.map(({ key, icon: Icon, color, bg, label }) => (
            <button
              key={key}
              onClick={() => onOpen(key, '')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 hover:brightness-110"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(229,226,225,0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = bg
                e.currentTarget.style.color = color
                e.currentTarget.style.borderColor = color + '44'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = 'rgba(229,226,225,0.5)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <Icon className="text-sm" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Expanded: toolbar row */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-4 flex items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}
          >
            {/* Attachment icon buttons */}
            <div className="flex items-center gap-0.5">
              {ATTACH_BUTTONS.map(({ key, icon: Icon, color, bg, label }) => (
                <button
                  key={key}
                  onClick={() => handleAttach(key)}
                  title={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90"
                  style={{ color: 'rgba(229,226,225,0.35)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = bg
                    e.currentTarget.style.color = color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(229,226,225,0.35)'
                  }}
                >
                  <Icon className="text-base" />
                </button>
              ))}
            </div>

            {/* Right: counter + cancel + post */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {text.length > 0 && <CharCounter length={text.length} />}

              <button
                onClick={() => { setExpanded(false); setText('') }}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10"
                style={{ color: 'rgba(229,226,225,0.4)' }}
                title="Cancel"
              >
                <MdClose className="text-sm" />
              </button>

              <button
                onClick={handlePost}
                disabled={!canPost}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{ background: 'linear-gradient(135deg, #DC2E73, #FB4040)' }}
              >
                Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── FeedSection ──────────────────────────────────────────────────────────────

export function FeedSection() {
  const { user } = useAuth()

  const author = {
    id:          user?.id          ?? 'guest',
    displayName: user?.display_name ?? user?.username ?? 'You',
    username:    user?.username    ? `@${user.username}` : '',
    avatarUrl:   formatAvatarUrl(user?.pfp),
    instruments: [],
  }

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery,  setSearchQuery]  = useState('')

  const [posts, setPosts]       = useState([])
  const [loadError, setLoadError] = useState(null)

  const loadPosts = useCallback(() => {
    postService.getFeed(user?.id)
      .then(setPosts)
      .catch((err) => {
        console.error('Failed to load posts:', err?.message ?? err)
        setLoadError(`Could not load posts: ${err?.message ?? 'unknown error'}`)
      })
  }, [user?.id])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Active composer type: 'clip' | 'jam' | 'show' | 'photo' | null
  const [openType, setOpenType]     = useState(null)
  // Per-composer form state, keyed by type
  const [composerState, setComposerState] = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  const openComposer = (type, prefillMessage = '') => {
    setOpenType(type)
    setComposerState((prev) => ({
      ...prev,
      [type]: {
        ...COMPOSER_CONFIG[type].initState(),
        // Pre-fill message/caption with whatever the user typed inline
        ...(prefillMessage ? { message: prefillMessage, caption: prefillMessage } : {}),
      },
    }))
  }

  const closeComposer = useCallback(() => setOpenType(null), [])

  // Plain text post (no modal needed)
  const handleTextPost = useCallback(async (content) => {
    await postService.createNewPost(content, null)
    loadPosts()
  }, [loadPosts])

  const patchComposerState = (type, patch) => {
    setComposerState((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }))
  }

  // ── Submit handlers ──────────────────────────────────────────────────────

  const handleSubmit = async (location) => {
    const type = openType
    const state = composerState[type] ?? {}
    setIsSubmitting(true)

    try {
      let content = ''
      let imageFile = null

      if (type === 'clip')   content = state.caption  || ''
      if (type === 'jam')    content = state.message   || ''
      if (type === 'show')   content = state.caption   || ''
      if (type === 'review') content = state.caption   || ''
      if (type === 'photo') {
        content   = state.caption || ''
        imageFile = state.photos?.[0]?.file ?? null
      }

      await postService.createNewPost(content, imageFile)
      loadPosts()
      closeComposer()
    } catch (err) {
      console.error('Post failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── canSubmit per type ───────────────────────────────────────────────────

  const canSubmit = (() => {
    const state = composerState[openType] ?? {}
    if (openType === 'clip')   return !!state.audioFile
    if (openType === 'jam')    return !!state.selectedJam
    if (openType === 'show')   return !!state.selectedShow
    if (openType === 'photo')  return state.photos?.length > 0
    if (openType === 'review') return !!state.selectedJam && state.rating > 0
    return false
  })()

  // ── Filtered feed ────────────────────────────────────────────────────────

  const displayed = posts.filter(
    (p) => matchesFilter(p, activeFilter) && matchesSearch(p, searchQuery)
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Composer entry point */}
      <PostComposer author={author} onOpen={openComposer} onPost={handleTextPost} />

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setActiveFilter(pill.key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
            style={{
              background: activeFilter === pill.key
                ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                : 'rgba(255,255,255,0.06)',
              color: activeFilter === pill.key ? '#fff' : 'rgba(229,226,225,0.55)',
              border: activeFilter === pill.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <MdSearch className="text-base flex-shrink-0" style={{ color: 'rgba(229,226,225,0.3)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts…"
          className="flex-1 bg-transparent text-sm text-white outline-none"
          style={{ caretColor: '#DC2E73' }}
        />
        <style>{`input::placeholder { color: rgba(229,226,225,0.25); }`}</style>
      </div>

      {/* Posts */}
      {loadError ? (
        <p className="text-sm text-center py-12" style={{ color: 'rgba(251,64,64,0.7)' }}>{loadError}</p>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <span className="text-3xl">🎵</span>
          <p className="text-sm" style={{ color: 'rgba(229,226,225,0.35)' }}>
            {posts.length === 0 ? 'Be the first to post something' : 'No posts match your filter'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 380, damping: 30 }}
            >
              <FeedPost post={post} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Composer modals ───────────────────────────────────────────────── */}

      {/* Clip */}
      <PostComposerModal
        open={openType === 'clip'}
        onClose={closeComposer}
        title={COMPOSER_CONFIG.clip.title}
        accent={COMPOSER_CONFIG.clip.accent}
        submitLabel={COMPOSER_CONFIG.clip.submitLabel}
        canSubmit={openType === 'clip' && canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        author={author}
      >
        <ClipComposerBody
          state={composerState.clip ?? COMPOSER_CONFIG.clip.initState()}
          onChange={(patch) => patchComposerState('clip', patch)}
        />
      </PostComposerModal>

      {/* Jam Invite */}
      <PostComposerModal
        open={openType === 'jam'}
        onClose={closeComposer}
        title={COMPOSER_CONFIG.jam.title}
        accent={COMPOSER_CONFIG.jam.accent}
        submitLabel={COMPOSER_CONFIG.jam.submitLabel}
        canSubmit={openType === 'jam' && canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        author={author}
      >
        <JamInviteComposerBody
          state={composerState.jam ?? COMPOSER_CONFIG.jam.initState()}
          onChange={(patch) => patchComposerState('jam', patch)}
        />
      </PostComposerModal>

      {/* Show Promo */}
      <PostComposerModal
        open={openType === 'show'}
        onClose={closeComposer}
        title={COMPOSER_CONFIG.show.title}
        accent={COMPOSER_CONFIG.show.accent}
        submitLabel={COMPOSER_CONFIG.show.submitLabel}
        canSubmit={openType === 'show' && canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        author={author}
      >
        <ShowPromoComposerBody
          state={composerState.show ?? COMPOSER_CONFIG.show.initState()}
          onChange={(patch) => patchComposerState('show', patch)}
          onCreateNew={() => {
            closeComposer()
            // TODO: open PromoteShowModal here if it's accessible from this context
            console.log('Open PromoteShowModal from here')
          }}
        />
      </PostComposerModal>

      {/* Photos */}
      <PostComposerModal
        open={openType === 'photo'}
        onClose={closeComposer}
        title={COMPOSER_CONFIG.photo.title}
        accent={COMPOSER_CONFIG.photo.accent}
        submitLabel={COMPOSER_CONFIG.photo.submitLabel}
        canSubmit={openType === 'photo' && canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        author={author}
      >
        <PhotoComposerBody
          state={composerState.photo ?? COMPOSER_CONFIG.photo.initState()}
          onChange={(patch) => patchComposerState('photo', patch)}
        />
      </PostComposerModal>

      {/* Review */}
      <PostComposerModal
        open={openType === 'review'}
        onClose={closeComposer}
        title={COMPOSER_CONFIG.review.title}
        accent={COMPOSER_CONFIG.review.accent}
        submitLabel={COMPOSER_CONFIG.review.submitLabel}
        canSubmit={openType === 'review' && canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        author={author}
      >
        <ReviewComposerBody
          state={composerState.review ?? COMPOSER_CONFIG.review.initState()}
          onChange={(patch) => patchComposerState('review', patch)}
        />
      </PostComposerModal>
    </div>
  )
}
