import { Music2 } from 'lucide-react'

const AVATAR_PALETTE = ['#C2185B', '#7B1FA2', '#1565C0', '#00695C', '#E65100', '#4527A0']

function FallbackAvatar({ name, size }) {
  const initials = (name || '?')
    .split(' ').slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase()
  const bg = AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  )
}

// ─── Compact participant chips rendered below the jam name ─────────────────────
// participants: { userId, name, role, isHost }[]
function ParticipantChips({ participants }) {
  if (!participants?.length) return null

  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             0,
        overflowX:       'auto',
        scrollbarWidth:  'none',
        WebkitOverflowScrolling: 'touch',
        marginTop:       3,
      }}
    >
      {participants.map((p, i) => {
        const firstName = p.name?.split(' ')[0] ?? p.name
        return (
          <span
            key={p.userId}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {/* Separator between chips */}
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{
                  color:   'rgba(229,226,225,0.15)',
                  margin:  '0 6px',
                  fontSize: '0.58rem',
                  flexShrink: 0,
                }}
              >
                ·
              </span>
            )}

            {/* Chip content */}
            <span
              style={{
                fontSize:      '0.62rem',
                letterSpacing: '0.01em',
                lineHeight:    1.2,
                whiteSpace:    'nowrap',
              }}
            >
              <span style={{ color: 'rgba(229,226,225,0.48)' }}>{firstName}</span>
              {p.role && (
                <span style={{ color: 'rgba(229,226,225,0.26)' }}> — {p.role}</span>
              )}
              {p.isHost && (
                <span
                  style={{
                    color:       'rgba(220,46,115,0.65)',
                    marginLeft:  3,
                    fontSize:    '0.58rem',
                    fontWeight:  600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  host
                </span>
              )}
            </span>
          </span>
        )
      })}
    </div>
  )
}

// ─── ChatHeader ───────────────────────────────────────────────────────────────
// participants: derived from jam attendee data; empty array = still loading or DM
const ChatHeader = ({ thread, users, participants = [], onJamLinkClick, onHeaderClick, onMembersClick, onHideDM }) => {
  const isJam = thread?.type === 'jam'

  let threadName  = ''
  let subInfo     = ''
  let participant = null

  if (isJam) {
    threadName = thread.name
    subInfo    = `${thread.memberCount} members · ${thread.onlineCount} online`
  } else if (thread?.type === 'dm') {
    participant = (users || []).find((u) => u.id === thread.participantId)
    // Fallback chain: resolved name → 'Direct Message' (never '')
    // An empty string would cause FallbackAvatar to render '?' which looks broken.
    threadName  = participant?.name || 'Direct Message'
    const s     = participant?.status
    subInfo     = s === 'online' ? 'Online' : s === 'away' ? 'Away' : 'Offline'
  }

  const statusDotColor =
    participant?.status === 'online' ? '#22C55E' :
    participant?.status === 'away'   ? '#F7C10D' :
    'rgba(229,226,225,0.25)'

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-5 flex-shrink-0"
      style={{
        paddingTop:           isJam && participants.length > 0 ? 10 : 12,
        paddingBottom:        isJam && participants.length > 0 ? 10 : 12,
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:         '1px solid rgba(255,255,255,0.06)',
        boxShadow:            '0 1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* ── Left: identity block ────────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center gap-3 min-w-0 flex-1',
          isJam && onHeaderClick
            ? 'cursor-pointer rounded-xl px-2 py-1 -mx-2 -my-1 transition-colors duration-150 hover:bg-white/5 active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2E73]/50'
            : '',
        ].join(' ')}
        role={isJam && onHeaderClick ? 'button' : undefined}
        tabIndex={isJam && onHeaderClick ? 0 : undefined}
        aria-label={isJam && onHeaderClick ? `View attendees for ${threadName}` : undefined}
        onClick={isJam && onHeaderClick ? onHeaderClick : undefined}
        onKeyDown={
          isJam && onHeaderClick
            ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHeaderClick() } }
            : undefined
        }
      >
        {/* Avatar / jam icon */}
        {!isJam && (
          <div className="flex-shrink-0">
            {participant?.avatar ? (
              <img
                src={participant.avatar}
                alt={participant?.name}
                className="rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <FallbackAvatar name={threadName} size={36} />
            )}
          </div>
        )}

        {isJam && (
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{ width: 36, height: 36, background: 'rgba(220,46,115,0.12)', color: '#DC2E73' }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Name + status + participant chips */}
        <div className="min-w-0 flex-1">
          {/* Thread name */}
          <div
            className="truncate"
            style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E5E2E1', lineHeight: '1.2' }}
          >
            {isJam
              ? <><span style={{ color: '#DC2E73' }}>#</span> {threadName}</>
              : threadName
            }
          </div>

          {/* Status / member count */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {!isJam && (
              <span
                style={{
                  display:         'inline-block',
                  width:           6,
                  height:          6,
                  borderRadius:    '50%',
                  backgroundColor: statusDotColor,
                  flexShrink:      0,
                }}
              />
            )}
            <span
              style={{
                fontSize:      '0.68rem',
                color:         'rgba(229,226,225,0.38)',
                letterSpacing: '0.02em',
              }}
            >
              {subInfo}
            </span>
          </div>

          {/* Participant chips — jam chats only, shown once attendee data is available */}
          {isJam && (
            <ParticipantChips participants={participants} />
          )}
        </div>
      </div>

      {/* ── Right: actions ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {/* Jam: members pill + View Jam */}
        {isJam && (
          <>
            {onMembersClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onMembersClick() }}
                className="flex items-center gap-1 transition-opacity hover:opacity-80 flex-shrink-0"
                style={{
                  background:   'rgba(255,255,255,0.07)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3rem',
                  padding:      '0.35rem 0.7rem',
                  fontSize:     '0.72rem',
                  color:        'rgba(229,226,225,0.55)',
                }}
                aria-label="View members"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{thread?.memberCount ?? ''}</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onJamLinkClick?.() }}
              className="flex items-center gap-1.5 text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              style={{
                background:   'linear-gradient(135deg, #DC2E73, #FB4040)',
                borderRadius: '3rem',
                padding:      '0.4rem 0.85rem',
                fontSize:     '0.8rem',
              }}
            >
              <Music2 size={14} />
              <span className="hidden sm:inline">View Jam</span>
            </button>
          </>
        )}

        {/* DM: kebab menu → Delete Conversation */}
        {!isJam && onHideDM && (
          <button
            onClick={(e) => { e.stopPropagation(); onHideDM() }}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors duration-150 hover:bg-white/[0.07] flex-shrink-0"
            style={{ color: 'rgba(229,226,225,0.38)' }}
            aria-label="More options"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatHeader
