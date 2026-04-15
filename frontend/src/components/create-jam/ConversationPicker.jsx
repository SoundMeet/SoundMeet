import { useState, useEffect } from 'react'
import { ArrowLeft, Check, User, AlertCircle } from 'lucide-react'
import { chatService } from '../../injectables/chatService'
import { formatAvatarUrl } from '../../utils/formatAvatarUrl'

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['#C2185B', '#7B1FA2', '#1565C0', '#00695C', '#E65100', '#4527A0']

const FallbackAvatar = ({ name, size = 38 }) => {
  const initials = (name || '?')
    .split(' ').slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase()
  const bg = AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <span style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  )
}

// ── Row skeleton ──────────────────────────────────────────────────────────────

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="rounded-full flex-shrink-0" style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.07)' }} />
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="h-3 rounded-full" style={{ width: '45%', background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-2.5 rounded-full" style={{ width: '28%', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  </div>
)

// ── Contact row ───────────────────────────────────────────────────────────────

const ContactRow = ({ contact, selected, onToggle }) => (
  <button
    onClick={() => onToggle(contact.convId)}
    className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-100"
    style={{
      background: selected ? 'rgba(220,46,115,0.07)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = selected ? 'rgba(220,46,115,0.07)' : 'transparent'
    }}
  >
    {/* Avatar */}
    <div className="flex-shrink-0">
      {contact.avatar
        ? <img src={contact.avatar} alt="" className="rounded-full object-cover" style={{ width: 38, height: 38 }} loading="lazy" />
        : <FallbackAvatar name={contact.name} />
      }
    </div>

    {/* Name + instrument */}
    <div className="flex-1 min-w-0 text-left">
      <p className="text-sm font-medium truncate" style={{ color: '#E5E2E1' }}>
        {contact.name}
      </p>
      {contact.mainInstrument && (
        <p className="text-xs truncate" style={{ color: 'rgba(229,226,225,0.4)' }}>
          {contact.mainInstrument}
        </p>
      )}
    </div>

    {/* Selection indicator */}
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: 22,
        height: 22,
        background: selected ? '#DC2E73' : 'transparent',
        border: selected ? '2px solid #DC2E73' : '2px solid rgba(255,255,255,0.18)',
      }}
    >
      {selected && <Check size={12} strokeWidth={3} color="#fff" />}
    </div>
  </button>
)

// ── ConversationPicker ────────────────────────────────────────────────────────

/**
 * Multi-select friend picker. Invites are sent only when the user taps the
 * send button — no optimistic per-row state, no undo complexity.
 *
 * Props:
 *   jamId   string — the newly created jam's id
 *   userId  string | null — current user's id (chat identity)
 *   onBack  () => void — go back to JamCreatedSheet main view
 *   onClose () => void — close the whole modal
 */
const ConversationPicker = ({ jamId, userId, onBack, onClose }) => {
  const [contacts,   setContacts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selected,   setSelected]   = useState(new Set()) // Set of convId
  const [sending,    setSending]    = useState(false)

  // ── Fetch + resolve DM contacts ────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const load = async () => {
      try {
        const conversations = await chatService.getUserConversations(userId)
        if (cancelled) return

        const dmConvs = conversations.filter((c) => !c.jam_id)
        const convIds = dmConvs.map((c) => c.id)

        const allParticipants = convIds.length
          ? await chatService.getParticipantsForConversations(convIds).catch(() => [])
          : []

        const otherUserIds = []
        dmConvs.forEach((conv) => {
          const participants = allParticipants.filter((p) => p.conversation_id === conv.id)
          const other = participants.find((p) => String(p.user_id) !== String(userId))
          if (other) otherUserIds.push(String(other.user_id))
        })

        const profiles = otherUserIds.length
          ? await chatService.getUsersProfiles(otherUserIds).catch(() => [])
          : []

        const profileMap = {}
        profiles.forEach((p) => { profileMap[String(p.user_id)] = p })

        // One entry per person, deduplicated by otherId (newest conversation wins).
        const seen = new Set()
        const result = []

        dmConvs.forEach((conv) => {
          const participants = allParticipants.filter((p) => p.conversation_id === conv.id)
          const other = participants.find((p) => String(p.user_id) !== String(userId))
          const otherId = other ? String(other.user_id) : null

          if (!otherId || seen.has(otherId)) return
          seen.add(otherId)

          const profile = profileMap[otherId]
          result.push({
            convId:         conv.id,
            name:           profile?.display_name ?? `User #${otherId}`,
            avatar:         profile?.pfp ? formatAvatarUrl(profile.pfp) : null,
            mainInstrument: profile?.mainInstrument ?? null,
          })
        })

        if (!cancelled) {
          setContacts(result)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setFetchError(true)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (convId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(convId)) next.delete(convId)
      else next.add(convId)
      return next
    })
  }

  // ── Send all selected invites then close ───────────────────────────────────

  const handleSend = async () => {
    if (selected.size === 0) { onClose(); return }
    setSending(true)
    await Promise.allSettled(
      [...selected].map((convId) =>
        chatService.sendMessage(convId, userId, `/jam/${jamId}`)
      )
    )
    onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasSelection = selected.size > 0
  const friendWord   = selected.size === 1 ? 'friend' : 'friends'

  return (
    <div className="flex flex-col" style={{ minHeight: 340, maxHeight: '75vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={onBack}
          disabled={sending}
          className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', color: sending ? 'rgba(229,226,225,0.2)' : 'rgba(229,226,225,0.55)' }}
          aria-label="Back"
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div>
          <h3
            className="text-base font-bold leading-tight"
            style={{ color: '#E5E2E1', fontFamily: 'Sora, sans-serif' }}
          >
            Invite to Jam
          </h3>
          <p className="text-xs" style={{ color: 'rgba(229,226,225,0.38)' }}>
            {hasSelection ? `${selected.size} ${friendWord} selected` : 'Select friends'}
          </p>
        </div>
      </div>

      <div className="h-px mx-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
        {loading && (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        )}

        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <AlertCircle size={22} color="rgba(229,226,225,0.25)" className="mb-2" />
            <p className="text-sm" style={{ color: 'rgba(229,226,225,0.4)' }}>
              Couldn't load contacts
            </p>
          </div>
        )}

        {!loading && !fetchError && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <User size={22} color="rgba(229,226,225,0.2)" className="mb-2" />
            <p className="text-sm" style={{ color: 'rgba(229,226,225,0.4)' }}>
              No contacts yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(229,226,225,0.25)' }}>
              Use "Copy Link" to share your jam
            </p>
          </div>
        )}

        {!loading && !fetchError && contacts.map((contact) => (
          <ContactRow
            key={contact.convId}
            contact={contact}
            selected={selected.has(contact.convId)}
            onToggle={toggleSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-150"
          style={{
            background: hasSelection
              ? 'linear-gradient(135deg, #DC2E73, #FB4040)'
              : 'rgba(255,255,255,0.05)',
            border: hasSelection ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: hasSelection ? '#fff' : 'rgba(229,226,225,0.6)',
            opacity: sending ? 0.6 : 1,
            cursor: sending ? 'wait' : 'pointer',
          }}
        >
          {sending
            ? 'Sending…'
            : hasSelection
              ? `Send Invite${selected.size > 1 ? 's' : ''}`
              : 'Done'
          }
        </button>
      </div>
    </div>
  )
}

export default ConversationPicker
