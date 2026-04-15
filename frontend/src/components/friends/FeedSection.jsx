import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSearch, MdMusicNote, MdHeadphones, MdStars, MdPhotoCamera, MdClose, MdStar, MdUploadFile } from 'react-icons/md'
import { postService } from '../../injectables/postService'
import { formatAvatarUrl } from '../../utils/formatAvatarUrl'
import { useAuth } from '../../injectables/Auth'
import { useFriends } from '../../context/FriendsContext'
import { extractEventLink } from '../../utils/eventLinkParser'
import { EventInviteCard } from '../event-invite/EventInviteCard'
import { FeedPost } from './FeedPost'
import { PostComposerModal } from './composer/PostComposerModal'
import { ClipComposerBody } from './composer/ClipComposerBody'
import { JamInviteComposerBody } from './composer/JamInviteComposerBody'
import { ShowPromoComposerBody } from './composer/ShowPromoComposerBody'
import { PhotoComposerBody } from './composer/PhotoComposerBody'
import { ReviewComposerBody } from './composer/ReviewComposerBody'
import { useToast } from '../../context/ToastContext'

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
          {remaining}
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

// Small X icon for dismissing the invite preview
const PreviewDismissIcon = () => (
  <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
)

// Drag-state visual config keyed by detected file type
const DRAG_VISUAL = {
  image: {
    accent:    '#34D399',
    border:    'rgba(52,211,153,0.55)',
    shadow:    '0 0 0 4px rgba(52,211,153,0.07)',
    overlayBg: 'rgba(52,211,153,0.04)',
    iconBg:    'rgba(52,211,153,0.12)',
    Icon:      MdPhotoCamera,
    label:     'Drop to share photos',
    hint:      'JPG, PNG, WebP, GIF',
  },
  audio: {
    accent:    '#A78BFA',
    border:    'rgba(167,139,250,0.55)',
    shadow:    '0 0 0 4px rgba(167,139,250,0.07)',
    overlayBg: 'rgba(167,139,250,0.04)',
    iconBg:    'rgba(167,139,250,0.12)',
    Icon:      MdHeadphones,
    label:     'Drop to post a clip',
    hint:      'MP3, WAV, AAC, M4A',
  },
  default: {
    accent:    'rgba(229,226,225,0.45)',
    border:    'rgba(229,226,225,0.2)',
    shadow:    '0 0 0 4px rgba(255,255,255,0.03)',
    overlayBg: 'rgba(255,255,255,0.02)',
    iconBg:    'rgba(255,255,255,0.07)',
    Icon:      MdUploadFile,
    label:     'Drop to create post',
    hint:      'Images · Audio',
  },
}

function PostComposer({ author, onOpen, onPost, isDragActive, dragFileType, onDropFiles }) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [dismissedLink, setDismissedLink] = useState(null)
  const textareaRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const canPost = text.trim().length > 0 && text.length <= MAX_CHARS

  const visual = DRAG_VISUAL[dragFileType] ?? DRAG_VISUAL.default

  // Derive event link from current text on every render (cheap string match)
  const detectedLink = extractEventLink(text)
  const showPreview  = !!detectedLink &&
    !(dismissedLink?.type === detectedLink?.type && dismissedLink?.id === detectedLink?.id)

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
          setDismissedLink(null)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded, text])

  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    autoResize()
    if (dismissedLink) {
      const still = extractEventLink(val)
      if (!still || still.type !== dismissedLink.type || still.id !== dismissedLink.id) {
        setDismissedLink(null)
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setExpanded(false); setText(''); setDismissedLink(null) }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canPost) handlePost()
  }

  const handlePost = () => {
    if (!canPost) return
    onPost(text.trim())
    setText('')
    setDismissedLink(null)
    setExpanded(false)
  }

  const handleAttach = (key) => {
    onOpen(key, text.trim())
    setText('')
    setDismissedLink(null)
    setExpanded(false)
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onDropFiles(files)
    e.target.value = ''
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: '#1a1a1a',
        border: isDragActive
          ? `1.5px dashed ${visual.border}`
          : `1px solid ${expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isDragActive
          ? visual.shadow
          : expanded ? '0 0 0 3px rgba(220,46,115,0.05), 0 4px 24px rgba(0,0,0,0.22)' : 'none',
        transition: 'border 0.18s, box-shadow 0.22s',
      }}
    >
      {/* ── Drop overlay ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 cursor-pointer select-none"
            style={{ background: visual.overlayBg }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: visual.iconBg }}
            >
              <visual.Icon style={{ color: visual.accent, fontSize: 19 }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold" style={{ color: visual.accent }}>
                {visual.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.28)' }}>
                {visual.hint}&nbsp;&nbsp;·&nbsp;&nbsp;
                <span style={{ color: visual.accent, opacity: 0.72 }}>click to browse</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input — used by drag overlay click + upload icon button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,audio/mp3,audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ── Composer body (dimmed during drag) ────────────────────────────────── */}
      <div
        style={{
          opacity: isDragActive ? 0.08 : 1,
          pointerEvents: isDragActive ? 'none' : 'auto',
          transition: 'opacity 0.18s',
        }}
      >
        <div className="px-4 pt-4 pb-2">
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
                  className="w-full text-left py-2.5 text-[13px] transition-colors duration-150 hover:text-white/40"
                  style={{ color: 'rgba(229,226,225,0.28)' }}
                >
                  What's on your musical mind?
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
                      onChange={handleTextChange}
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

                    {showPreview && (
                      <div className="relative mt-2 mb-1">
                        <EventInviteCard
                          type={detectedLink.type}
                          id={detectedLink.id}
                          compact={false}
                          previewOnly={true}
                        />
                        <button
                          onClick={() => setDismissedLink(detectedLink)}
                          aria-label="Remove event preview"
                          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/20"
                          style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(229,226,225,0.8)' }}
                        >
                          <PreviewDismissIcon />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Collapsed: action pills */}
        {!expanded && (
          <div
            className="px-4 pb-4 flex items-center gap-1.5 flex-wrap"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}
          >
            {ATTACH_BUTTONS.map(({ key, icon: Icon, color, bg, label }) => (
              <button
                key={key}
                onClick={() => onOpen(key, '')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(229,226,225,0.48)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = bg
                  e.currentTarget.style.color = color
                  e.currentTarget.style.borderColor = color + '55'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'rgba(229,226,225,0.48)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <Icon className="text-[13px]" />
                {label}
              </button>
            ))}

            {/* Upload shortcut */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo or audio"
              className="ml-auto flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-all duration-150"
              style={{ color: 'rgba(229,226,225,0.2)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = 'rgba(229,226,225,0.55)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(229,226,225,0.2)'
              }}
            >
              <MdUploadFile className="text-sm" />
            </button>
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
                  onClick={() => { setExpanded(false); setText(''); setDismissedLink(null) }}
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
    </div>
  )
}

// ─── FeedSection ──────────────────────────────────────────────────────────────

export function FeedSection({ feedTab = 'forYou' }) {
  const { user } = useAuth()
  const { friends } = useFriends()
  const { showToast } = useToast()
  const friendIds = new Set(friends.map((f) => String(f.id)))

  const author = {
    id:          user?.id          ?? 'guest',
    displayName: user?.display_name ?? user?.username ?? 'You',
    username:    user?.username    ? `@${user.username}` : '',
    avatarUrl:   formatAvatarUrl(user?.pfp),
    instruments: [],
  }

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery,  setSearchQuery]  = useState('')

  const [posts, setPosts]         = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading]     = useState(true)

  const loadPosts = useCallback(() => {
    setLoading(true)
    postService.getFeed(user?.id)
      .then((rows) => {
        setPosts(rows)
        setLoadError(null)
      })
      .catch((err) => {
        console.error('[FeedSection] Failed to load posts:', err?.message ?? err)
        setLoadError(`Could not load posts: ${err?.message ?? 'unknown error'}`)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Active composer type: 'clip' | 'jam' | 'show' | 'photo' | null
  const [openType, setOpenType]     = useState(null)
  const [composerState, setComposerState] = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  // ── Drag-and-drop state ───────────────────────────────────────────────────
  const [dragActive,   setDragActive]   = useState(false)
  const [dragFileType, setDragFileType] = useState(null) // 'image' | 'audio' | 'video' | 'unknown' | null
  const feedRef        = useRef(null)  // outer feed div — used for relatedTarget containment check
  const dragActiveRef  = useRef(false) // mirrors dragActive without stale-closure risk

  const openComposer = (type, prefillMessage = '', prefillMedia = null) => {
    setOpenType(type)
    setComposerState((prev) => ({
      ...prev,
      [type]: {
        ...COMPOSER_CONFIG[type].initState(),
        ...(prefillMessage ? { message: prefillMessage, caption: prefillMessage } : {}),
        ...(prefillMedia ?? {}),
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
      if (type === 'review') content = state.caption   || ''

      if (type === 'jam') {
        const msg  = (state.message || '').trim()
        const link = state.selectedJam?.id ? `/jam/${state.selectedJam.id}` : ''
        content = [msg, link].filter(Boolean).join('\n')
      }

      if (type === 'show') {
        const cap  = (state.caption || '').trim()
        const link = state.selectedShow?.id ? `/show/${state.selectedShow.id}` : ''
        content = [cap, link].filter(Boolean).join('\n')
      }
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

  // ── Drag handlers ────────────────────────────────────────────────────────

  const detectDragType = (dataTransfer) => {
    const items = Array.from(dataTransfer.items || [])
    const first = items.find((i) => i.kind === 'file')
    if (!first) return null
    if (first.type.startsWith('image/')) return 'image'
    if (first.type.startsWith('audio/')) return 'audio'
    if (first.type.startsWith('video/')) return 'video'
    return 'unknown'
  }

  const handleDragEnter = useCallback((e) => {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    if (!dragActiveRef.current) {
      dragActiveRef.current = true
      setDragActive(true)
      setDragFileType(detectDragType(e.dataTransfer))
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    // Only deactivate when the pointer has left the feed container entirely
    if (feedRef.current && feedRef.current.contains(e.relatedTarget)) return
    dragActiveRef.current = false
    setDragActive(false)
    setDragFileType(null)
  }, [])

  const handleDragOver = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault()
  }, [])

  // Route dropped files into the appropriate composer
  const handleDroppedFiles = useCallback((files) => {
    if (!files.length) return

    // Don't clobber a composer that's already open
    if (openType !== null) {
      showToast('Finish your current post first.', 'info')
      return
    }

    const first = files[0]

    // ── Image ──────────────────────────────────────────────────────────────
    if (first.type.startsWith('image/')) {
      const imageFiles = files.filter((f) => f.type.startsWith('image/')).slice(0, 4)
      const oversized  = imageFiles.find((f) => f.size > 20 * 1024 * 1024)
      if (oversized) {
        showToast('Images must be under 20 MB each.', 'error')
        return
      }
      if (files.length > imageFiles.length) {
        showToast('Only image files were added — other types were skipped.', 'info')
      }
      const photos = imageFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
      openComposer('photo', '', { photos })
      return
    }

    // ── Audio ──────────────────────────────────────────────────────────────
    if (first.type.startsWith('audio/')) {
      if (files.length > 1) showToast('Only one audio clip can be posted at a time.', 'info')
      if (first.size > 50 * 1024 * 1024) {
        showToast('Audio file must be under 50 MB.', 'error')
        return
      }
      openComposer('clip', '', { audioFile: first })
      return
    }

    // ── Video ──────────────────────────────────────────────────────────────
    if (first.type.startsWith('video/')) {
      showToast('Video posts are not yet supported. Try uploading audio instead.', 'info')
      return
    }

    // ── Unsupported ────────────────────────────────────────────────────────
    showToast('Unsupported file type. Drop an image or audio file.', 'error')
  }, [openType, showToast]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDropOnFeed = useCallback((e) => {
    e.preventDefault()
    dragActiveRef.current = false
    setDragActive(false)
    setDragFileType(null)
    handleDroppedFiles(Array.from(e.dataTransfer.files))
  }, [handleDroppedFiles])

  // ── Filtered feed ────────────────────────────────────────────────────────

  const displayed = posts.filter(
    (p) =>
      matchesFilter(p, activeFilter) &&
      matchesSearch(p, searchQuery) &&
      (feedTab !== 'following' || friendIds.has(String(p.author.id)))
  )

  return (
    <div
      ref={feedRef}
      className="flex flex-col gap-3"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDropOnFeed}
    >
      {/* Composer entry point */}
      <PostComposer
        author={author}
        onOpen={openComposer}
        onPost={handleTextPost}
        isDragActive={dragActive}
        dragFileType={dragFileType}
        onDropFiles={handleDroppedFiles}
      />

      {/* Filter + Search row */}
      <div className="flex flex-col gap-2">
        {/* Filter pills — horizontally scrollable */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = activeFilter === pill.key
            return (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-semibold transition-all duration-150 active:scale-95"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                    : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : 'rgba(229,226,225,0.52)',
                  border: isActive ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive ? '0 2px 12px rgba(220,46,115,0.2)' : 'none',
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          onFocus={() => {}}
          onBlur={() => {}}
        >
          <MdSearch className="text-base flex-shrink-0" style={{ color: 'rgba(229,226,225,0.28)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/[0.22]"
            style={{ caretColor: '#DC2E73' }}
            onFocus={(e) => {
              e.currentTarget.closest('div').style.borderColor = 'rgba(220,46,115,0.25)'
            }}
            onBlur={(e) => {
              e.currentTarget.closest('div').style.borderColor = 'rgba(255,255,255,0.07)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgba(229,226,225,0.4)' }}
            >
              <MdClose className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      {loadError ? (
        <div
          className="flex flex-col items-center py-12 gap-2 rounded-2xl"
          style={{ border: '1px dashed rgba(251,64,64,0.2)', background: 'rgba(251,64,64,0.03)' }}
        >
          <p className="text-[13px]" style={{ color: 'rgba(251,64,64,0.65)' }}>{loadError}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(220,46,115,0.25)', borderTopColor: '#DC2E73' }}
          />
          <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.28)' }}>Loading feed…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div
          className="flex flex-col items-center py-14 gap-3 rounded-2xl"
          style={{
            border: '1px dashed rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(229,226,225,0.3)' }}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium" style={{ color: 'rgba(229,226,225,0.5)' }}>
              {feedTab === 'following' && friends.length === 0
                ? 'Add friends to see their posts'
                : feedTab === 'following'
                ? "Your friends haven't posted yet"
                : posts.length === 0
                ? 'Be the first to post something'
                : 'No posts match your filter'}
            </p>
            {posts.length === 0 && feedTab !== 'following' && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(229,226,225,0.25)' }}>
                Share a clip, invite to a jam, or promote a show
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Feed list header */}
          {!searchQuery && activeFilter === 'all' && (
            <div className="flex items-center gap-2 px-0.5">
              <span
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: 'rgba(229,226,225,0.28)' }}
              >
                {feedTab === 'following' ? 'From friends' : 'Latest'}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(229,226,225,0.18)' }}>
                {displayed.length} {displayed.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {displayed.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 380, damping: 30 }}
              >
                <FeedPost post={post} />
              </motion.div>
            ))}
          </div>
        </>
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
          currentUserId={user?.id}
        />
      </PostComposerModal>
    </div>
  )
}
