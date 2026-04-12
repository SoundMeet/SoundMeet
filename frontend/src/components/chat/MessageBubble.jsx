import { Crown, Music2 } from 'lucide-react'
import { extractEventLink, stripEventLink } from '../../utils/eventLinkParser'
import { EventInviteCard } from '../event-invite/EventInviteCard'

// ─── Small inline "Host" badge ────────────────────────────────────────────────
const HostBadge = () => (
  <span
    style={{
      display:       'inline-flex',
      alignItems:    'center',
      fontSize:      '0.55rem',
      fontWeight:    700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color:         '#DC2E73',
      background:    'rgba(220,46,115,0.12)',
      border:        '1px solid rgba(220,46,115,0.22)',
      borderRadius:  3,
      padding:       '1px 4px',
      lineHeight:    1.4,
      flexShrink:    0,
    }}
  >
    Host
  </span>
)

// ─── Fallback avatar when no image URL is available ───────────────────────────
const AVATAR_PALETTE = ['#C2185B', '#7B1FA2', '#1565C0', '#00695C', '#E65100', '#4527A0']

const FallbackAvatar = ({ name, size }) => {
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

// ─── Avatar with optional role badge ─────────────────────────────────────────
const SenderAvatar = ({ sender, jamMeta }) => {
  const showBadge = !!(jamMeta && (jamMeta.isHost || jamMeta.role))

  return (
    <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
      {sender?.avatar ? (
        <img
          src={sender.avatar}
          alt={sender.name}
          className="rounded-full object-cover"
          style={{ width: 32, height: 32 }}
        />
      ) : (
        <FallbackAvatar name={sender?.name} size={32} />
      )}

      {/* Tiny corner badge — host (pink crown) or musician (muted note) */}
      {showBadge && (
        <div
          style={{
            position:       'absolute',
            bottom:         -1,
            right:          -1,
            width:          13,
            height:         13,
            borderRadius:   '50%',
            background:     jamMeta.isHost
              ? 'rgba(220,46,115,0.9)'
              : 'rgba(35,35,35,0.92)',
            border:         '1.5px solid rgba(15,15,15,0.85)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          {jamMeta.isHost
            ? <Crown  size={6.5} color="#fff"               strokeWidth={2.5} />
            : <Music2 size={6.5} color="rgba(167,139,250,0.9)" strokeWidth={2.5} />
          }
        </div>
      )}
    </div>
  )
}

// ─── Sender identity block above first message in a group ─────────────────────
// Shows: name [Host badge?] / role or "Bringing X" (jam chats only, muted second line)
const SenderInfo = ({ sender, jamMeta }) => {
  let metaLine = ''
  if (jamMeta) {
    if (jamMeta.role) {
      metaLine = jamMeta.role
    } else if (jamMeta.bringing?.[0]) {
      metaLine = `Bringing ${jamMeta.bringing[0]}`
    }
  }

  return (
    <div className="mb-1 ml-1" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            fontSize:      '0.68rem',
            color:         'rgba(229,226,225,0.52)',
            letterSpacing: '0.03em',
            lineHeight:    1.2,
          }}
        >
          {sender.name}
        </span>
        {jamMeta?.isHost && <HostBadge />}
      </div>

      {/* Role / gear line — jam chats only */}
      {metaLine && (
        <span
          style={{
            fontSize:      '0.62rem',
            color:         'rgba(220,46,115,0.8)',
            letterSpacing: '0.02em',
            lineHeight:    1.2,
          }}
        >
          {metaLine}
        </span>
      )}
    </div>
  )
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────
// jamMeta: { role: string|null, isHost: boolean, bringing: string[] } | null
//   — null means this is a DM or attendee data is not yet loaded

const MessageBubble = ({ message, isOutgoing, showSenderInfo, sender, isFirst, isLast, jamMeta }) => {
  const R = 18  // base corner radius
  const r = 5   // tight corner for grouped messages

  const borderRadius = isOutgoing
    ? `${R}px ${isFirst ? R : r}px ${isLast ? R : r}px ${R}px`
    : `${isFirst ? R : r}px ${R}px ${R}px ${isLast ? R : r}px`

  const eventLink   = extractEventLink(message.content)
  const displayText = eventLink ? stripEventLink(message.content) : message.content
  const hasText     = displayText.trim().length > 0
  const hasCard     = !!eventLink

  const columnMaxWidth = hasCard && !hasText ? '82%' : '68%'

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'items-end gap-2.5'}`}>

      {/* Incoming: avatar column — reserve space so bubbles stay aligned */}
      {!isOutgoing && (
        <div style={{ width: 32, flexShrink: 0 }}>
          {showSenderInfo && sender && (
            <SenderAvatar sender={sender} jamMeta={jamMeta} />
          )}
        </div>
      )}

      {/* Bubble column */}
      <div
        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: columnMaxWidth }}
      >
        {/* Sender identity above first incoming message */}
        {showSenderInfo && !isOutgoing && sender && (
          <SenderInfo sender={sender} jamMeta={jamMeta} />
        )}

        <div className="group w-full">
          {/* Text bubble */}
          {hasText && (
            <div
              className="text-sm leading-relaxed"
              style={{
                background: isOutgoing
                  ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
                  : 'rgba(255,255,255,0.07)',
                color:        isOutgoing ? '#fff' : '#E5E2E1',
                borderRadius,
                padding:      '0.55rem 0.9rem',
                wordBreak:    'break-word',
                border:       isOutgoing ? 'none' : '1px solid rgba(255,255,255,0.06)',
                marginBottom: hasCard ? 6 : 0,
              }}
            >
              {displayText}
            </div>
          )}

          {/* Event invite card */}
          {hasCard && (
            <EventInviteCard
              type={eventLink.type}
              id={eventLink.id}
              compact={true}
            />
          )}

          {/* Timestamp on hover */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-0.5 px-1"
            style={{
              fontSize:  '0.65rem',
              color:     'rgba(229,226,225,0.35)',
              textAlign: isOutgoing ? 'right' : 'left',
            }}
          >
            {message.timestamp}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
