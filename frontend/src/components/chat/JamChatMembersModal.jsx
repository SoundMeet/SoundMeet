/**
 * JamChatMembersModal — opened from the jam chat header.
 *
 * Tabs: All · Friends · Coverage
 *
 * Regular attendee view:
 *   - Attendee list with friend badges + add-friend actions
 *   - Coverage tab (view jam needs; toggle what you're bringing)
 *   - "Leave Jam Chat" (always available — removes from chat, keeps attendance)
 *   - "Leave Jam" (upcoming/live only — removes attendance + chat)
 *
 * Host/admin view:
 *   - Full attendee management (inline confirm-remove others)
 *   - No self-leave path (host leaving requires delete/transfer flow)
 *
 * z-[65]: above Chat page, below DestructiveConfirmSheet (z-[70]).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { jamService } from '../../injectables/jamService'
import { chatService } from '../../injectables/chatService'
import { socialService } from '../../injectables/socialService'
import { getEventLifecycleState } from '../../utils/eventComputed'
import { formatAvatarUrl } from '../../utils/formatAvatarUrl'
import { hexToRgba } from '../../utils/discovery'
import { nameToInitials } from '../../utils/eventComputed'
import { DestructiveConfirmSheet } from '../event-detail/DestructiveConfirmSheet'
import { ProfilesRUS } from '../../services/ProfilesRUS'

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

const RemoveIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const AddFriendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
)

// ─── Shared primitives ────────────────────────────────────────────────────────

const Badge = ({ children, color, bg, border }) => (
  <span
    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none shrink-0"
    style={{ color, background: bg, border: `1px solid ${border}` }}
  >
    {children}
  </span>
)

const Chip = ({ children }) => (
  <span
    className="text-[11px] px-2 py-0.5 rounded-full leading-snug"
    style={{
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(229,226,225,0.6)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}
  >
    {children}
  </span>
)

const SectionLabel = ({ children }) => (
  <p
    className="text-[9px] font-semibold uppercase tracking-[0.14em] mb-1.5"
    style={{ color: 'rgba(229,226,225,0.28)' }}
  >
    {children}
  </p>
)

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AttendeeAvatar = ({ name, pfp, accent, isHost }) => {
  const avatarUrl = formatAvatarUrl(pfp)
  const initials  = nameToInitials(name)

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="h-10 w-10 rounded-xl object-cover shrink-0"
      style={{ border: `1px solid ${hexToRgba(accent, 0.18)}` }}
    />
  ) : (
    <div
      className="h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 select-none"
      style={{
        background: isHost ? hexToRgba(accent, 0.16) : 'rgba(255,255,255,0.06)',
        color:      isHost ? accent : 'rgba(229,226,225,0.45)',
        border:     `1px solid ${isHost ? hexToRgba(accent, 0.22) : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {initials}
    </div>
  )
}

// ─── Coverage tab ─────────────────────────────────────────────────────────────

const SERVICE_FIELD_MAP = {
  instrumentsBringing: 'instruments',
  rolesBringing:       'roles',
  gearBringing:        'gear',
}

const CoverageTab = ({ item, attendees, currentUserId, onToggleBringing, togglingItem, isAdminMode }) => {
  const myAttendee = !isAdminMode
    ? attendees.find((a) => String(a.userId) === String(currentUserId))
    : null

  const buildMap = (field) => {
    const map = {}
    attendees.forEach((a) => {
      ;(a[field] ?? []).forEach((name) => {
        const key = name.toLowerCase()
        if (!map[key]) map[key] = { label: name, contributors: [] }
        map[key].contributors.push(a.displayName)
      })
    })
    return map
  }

  const instrumentMap = buildMap('instrumentsBringing')
  const roleMap       = buildMap('rolesBringing')
  const gearMap       = buildMap('gearBringing')

  const sections = [
    { key: 'instruments', label: 'Instruments', needs: item?.instrumentsNeeded ?? [], map: instrumentMap, field: 'instrumentsBringing' },
    { key: 'roles',       label: 'Roles',       needs: item?.rolesNeeded       ?? [], map: roleMap,       field: 'rolesBringing'       },
    { key: 'gear',        label: 'Gear needed', needs: item?.gearNeededItems   ?? [], map: gearMap,       field: 'gearBringing'        },
  ].filter((s) => s.needs.length > 0)

  const totalNeeded  = sections.reduce((n, s) => n + s.needs.length, 0)
  const totalCovered = sections.reduce((n, s) =>
    n + s.needs.filter((need) => s.map[need.toLowerCase()]).length, 0
  )
  const allCovered = totalNeeded > 0 && totalCovered === totalNeeded
  const pct = totalNeeded > 0 ? Math.round((totalCovered / totalNeeded) * 100) : 0

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2.5">
        <span style={{ color: 'rgba(229,226,225,0.18)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
            <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-white">No requirements set</span>
        <span className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(229,226,225,0.3)' }}>
          The host hasn't specified what instruments,<br />roles, or gear are needed
        </span>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-5">
      {/* Summary block */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{
          background: allCovered ? 'rgba(74,222,128,0.06)' : 'rgba(251,180,64,0.05)',
          border: `1px solid ${allCovered ? 'rgba(74,222,128,0.14)' : 'rgba(251,180,64,0.12)'}`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[13px] font-bold" style={{ color: allCovered ? '#4ade80' : '#fbb440' }}>
              {allCovered ? 'All needs covered' : `${totalCovered} of ${totalNeeded} covered`}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.35)' }}>
              {totalNeeded - totalCovered === 0
                ? 'Everything is sorted'
                : `${totalNeeded - totalCovered} item${totalNeeded - totalCovered > 1 ? 's' : ''} still needed`}
            </p>
          </div>
          <span
            className="text-[22px] font-bold tabular-nums leading-none"
            style={{ color: allCovered ? '#4ade80' : '#fbb440' }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: allCovered ? '#4ade80' : '#fbb440', opacity: 0.7 }}
          />
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.key}>
          <SectionLabel>{section.label}</SectionLabel>
          <div className="space-y-1.5">
            {section.needs.map((need) => {
              const match      = section.map[need.toLowerCase()]
              const covered    = !!match
              const toggleKey  = `${section.field}:${need}`
              const isToggling = togglingItem === toggleKey
              const amBringing = myAttendee
                ? (myAttendee[section.field] ?? []).some((x) => x.toLowerCase() === need.toLowerCase())
                : false

              return (
                <div
                  key={need}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                  style={{
                    background: covered ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${covered ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.055)'}`,
                  }}
                >
                  <span className="shrink-0 flex" style={{ color: covered ? '#4ade80' : 'rgba(251,180,64,0.65)' }}>
                    {covered ? <CheckIcon /> : <AlertIcon />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-tight">{need}</p>
                    <p
                      className="text-[10px] mt-0.5 leading-relaxed truncate"
                      style={{ color: covered ? 'rgba(229,226,225,0.38)' : 'rgba(229,226,225,0.22)' }}
                    >
                      {covered ? match.contributors.join(', ') : 'Nobody bringing this yet'}
                    </p>
                  </div>
                  {myAttendee && (
                    <div className="shrink-0">
                      {amBringing ? (
                        <button
                          onClick={() => onToggleBringing(section.field, need)}
                          disabled={isToggling}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 disabled:opacity-40"
                          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }}
                        >
                          {isToggling ? '…' : (<>Bringing <span style={{ opacity: 0.65, lineHeight: 1 }}>×</span></>)}
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleBringing(section.field, need)}
                          disabled={isToggling}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.45)', border: '1px solid rgba(255,255,255,0.09)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(229,226,225,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        >
                          {isToggling ? '…' : '+ Bring'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {myAttendee && (
        <p className="text-[10px] text-center pb-1" style={{ color: 'rgba(229,226,225,0.15)' }}>
          Tap an item to commit or uncommit what you're bringing
        </p>
      )}
    </div>
  )
}

// ─── Attendee row ─────────────────────────────────────────────────────────────

const AVATAR_W = 40

const AttendeeRow = ({
  attendee, adminId, accent,
  isFriend, isYou, isAdminMode,
  onRemove, isRemoving, confirmingRemove, onConfirmRemove, onCancelRemove,
  requestSent, onAddFriend, onCancelRequest, onOpenProfile,
}) => {
  const [hoveringRequest, setHoveringRequest] = useState(false)
  const isHost    = String(attendee.userId) === String(adminId)
  const canRemove = !isHost && !isYou && isAdminMode

  const identityParts = [
    ...(attendee.instrumentsBringing ?? []),
    ...(attendee.rolesBringing       ?? []),
  ]
  const identityLine = identityParts.join(' · ')
  const gear         = attendee.gearBringing ?? []
  const hasGear      = gear.length > 0
  const hasAny       = identityParts.length > 0 || hasGear

  return (
    <div className="py-4">
      {/* 3-zone row: avatar | content | actions */}
      <div className="flex items-start gap-3">

        {/* Zone 1 — avatar (clickable to profile) */}
        <button
          onClick={() => onOpenProfile?.()}
          className="flex-shrink-0 transition-opacity hover:opacity-75 active:opacity-60"
          style={{ background: 'none', border: 'none', padding: 0, cursor: onOpenProfile ? 'pointer' : 'default' }}
          aria-label={`View ${attendee.displayName}'s profile`}
        >
          <AttendeeAvatar name={attendee.displayName} pfp={attendee.pfp} accent={accent} isHost={isHost} />
        </button>

        {/* Zone 2 — content (name clickable to profile) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onOpenProfile?.()}
              className="text-[13px] font-semibold text-white leading-tight transition-opacity hover:opacity-75"
              style={{ background: 'none', border: 'none', padding: 0, cursor: onOpenProfile ? 'pointer' : 'default' }}
            >
              {attendee.displayName}
            </button>
            {isHost && (
              <Badge color={accent} bg={hexToRgba(accent, 0.13)} border={hexToRgba(accent, 0.2)}>Host</Badge>
            )}
            {isYou && (
              <Badge color="rgba(229,226,225,0.55)" bg="rgba(255,255,255,0.07)" border="rgba(255,255,255,0.1)">You</Badge>
            )}
            {isFriend && !isHost && !isYou && (
              <Badge color="#4ade80" bg="rgba(74,222,128,0.1)" border="rgba(74,222,128,0.18)">Friend</Badge>
            )}
          </div>

          {identityLine ? (
            <p className="text-[11px] mt-1 leading-snug truncate" style={{ color: 'rgba(229,226,225,0.38)' }}>
              {identityLine}
            </p>
          ) : !hasAny ? (
            <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(229,226,225,0.2)' }}>
              Nothing listed
            </p>
          ) : null}

          {hasGear && (
            <div className="mt-3">
              <SectionLabel>{isHost ? 'Available at jam' : 'Bringing'}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {gear.map((g) => <Chip key={g}>{g}</Chip>)}
              </div>
            </div>
          )}
        </div>

        {/* Zone 3 — action rail */}
        <div className="shrink-0 flex items-center gap-1.5 self-center">
          {/* Add friend / pending cancel — only for non-self, non-friend, non-host */}
          {!isYou && !isFriend && !isHost && (
            requestSent ? (
              <button
                onClick={onCancelRequest}
                aria-label="Cancel friend request"
                className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
                style={{
                  background: hoveringRequest ? 'rgba(251,64,64,0.12)' : 'rgba(255,255,255,0.05)',
                  color:      hoveringRequest ? 'rgba(251,64,64,0.7)' : 'rgba(229,226,225,0.22)',
                  border:     hoveringRequest ? '1px solid rgba(251,64,64,0.18)' : '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={() => setHoveringRequest(true)}
                onMouseLeave={() => setHoveringRequest(false)}
              >
                {hoveringRequest ? <RemoveIcon /> : <AddFriendIcon />}
              </button>
            ) : (
              <button
                onClick={onAddFriend}
                aria-label={`Add ${attendee.displayName} as friend`}
                className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
                style={{
                  background: hexToRgba(accent, 0.1),
                  color:      accent,
                  border:     `1px solid ${hexToRgba(accent, 0.2)}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = hexToRgba(accent, 0.2) }}
                onMouseLeave={(e) => { e.currentTarget.style.background = hexToRgba(accent, 0.1) }}
              >
                <AddFriendIcon />
              </button>
            )
          )}

          {/* Remove — only for admin mode, non-host, non-self */}
          {canRemove && !confirmingRemove && (
            <button
              onClick={onRemove}
              disabled={isRemoving}
              aria-label={`Remove ${attendee.displayName}`}
              className="h-11 w-11 md:h-7 md:w-7 flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-40"
              style={{ background: 'rgba(251,64,64,0.08)', color: 'rgba(251,64,64,0.45)', border: '1px solid rgba(251,64,64,0.1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,64,64,0.16)'; e.currentTarget.style.color = '#fb4040'; e.currentTarget.style.border = '1px solid rgba(251,64,64,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,64,64,0.08)'; e.currentTarget.style.color = 'rgba(251,64,64,0.45)'; e.currentTarget.style.border = '1px solid rgba(251,64,64,0.1)' }}
            >
              <RemoveIcon />
            </button>
          )}
        </div>
      </div>

      {/* Inline confirm — inset to content zone */}
      {confirmingRemove && (
        <div
          className="mt-2.5 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl"
          style={{
            marginLeft: AVATAR_W + 12,
            background: 'rgba(251,64,64,0.06)',
            border: '1px solid rgba(251,64,64,0.13)',
          }}
        >
          <span className="text-[11px] leading-snug" style={{ color: 'rgba(229,226,225,0.55)' }}>
            Remove <span className="font-semibold text-white">{attendee.displayName}</span>?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCancelRemove}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors duration-150"
              style={{ color: 'rgba(229,226,225,0.45)', background: 'rgba(255,255,255,0.06)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirmRemove}
              disabled={isRemoving}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-colors duration-150 disabled:opacity-50"
              style={{ color: '#fff', background: 'rgba(251,64,64,0.72)' }}
            >
              {isRemoving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── JamChatMembersModal ──────────────────────────────────────────────────────

/**
 * Props:
 *   open             {boolean}
 *   onClose          {Function}
 *   item             {Object}   Normalized jam item (needs admin_id, dateTimeRaw, endDateTimeRaw)
 *   conversationId   {string}
 *   currentUserId    {number|string}
 *   isAdminMode      {boolean}  True if current user is the jam host/admin
 *   accent           {string}   Hex colour
 *   onLeaveChat      {Function} Called after user confirms leave chat — parent removes chat from list
 *   onLeaveJam       {Function} Called after user confirms leave jam — parent removes jam from list
 */
export function JamChatMembersModal({
  open,
  onClose,
  item,
  conversationId,
  currentUserId,
  isAdminMode = false,
  accent = '#DC2E73',
  onLeaveChat,
  onLeaveJam,
}) {
  const navigate = useNavigate()
  const [attendees,       setAttendees]       = useState([])
  const [friendIds,       setFriendIds]       = useState(new Set())
  const [activeTab,       setActiveTab]       = useState('all')
  const [loading,         setLoading]         = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [removingId,      setRemovingId]      = useState(null)
  const [togglingItem,    setTogglingItem]    = useState(null)
  // Map<userId, requestId> — stores sent request IDs so we can cancel them
  const [sentRequests,    setSentRequests]    = useState(new Map())

  // Confirm sheets
  const [leaveChatOpen,   setLeaveChatOpen]   = useState(false)
  const [leaveJamOpen,    setLeaveJamOpen]    = useState(false)
  const [actionLoading,   setActionLoading]   = useState(false)

  const lifecycle   = item ? getEventLifecycleState(item) : 'upcoming'
  const canLeaveJam = lifecycle === 'upcoming' || lifecycle === 'live'
  const isPast      = lifecycle === 'ended'

  // Load attendees + friends in parallel when opened
  useEffect(() => {
    if (!open || !item?.id) return
    let cancelled = false

    setLoading(true)
    Promise.all([
      jamService.getJamAttendees(item.id),
      currentUserId ? socialService.getMyFriends(currentUserId) : Promise.resolve([]),
    ])
      .then(([list, friends]) => {
        if (cancelled) return
        setFriendIds(new Set(friends.map((f) => String(f.id))))
        const normalized = list.map((a) =>
          String(a.userId) === String(item.admin_id)
            ? { ...a, gearBringing: item.gearProvidedItems ?? [] }
            : a
        )
        setAttendees(
          [...normalized].sort((a, b) => {
            const aH = String(a.userId) === String(item.admin_id)
            const bH = String(b.userId) === String(item.admin_id)
            if (aH && !bH) return -1
            if (!aH && bH) return 1
            return a.displayName.localeCompare(b.displayName)
          })
        )
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [open, item?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!open) {
      setActiveTab('all')
      setLeaveChatOpen(false)
      setLeaveJamOpen(false)
      setActionLoading(false)
      setConfirmRemoveId(null)
      setRemovingId(null)
      setSentRequests(new Map())
      setTogglingItem(null)
    }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  // ── Friend actions ──────────────────────────────────────────────────────────

  const handleAddFriend = async (userId) => {
    setSentRequests((prev) => new Map(prev).set(String(userId), null))
    try {
      const res = await socialService.sendFriendRequest(userId)
      setSentRequests((prev) => new Map(prev).set(String(userId), res?.id ?? null))
    } catch (err) {
      console.error('[JamChatMembersModal] add friend failed:', err)
      setSentRequests((prev) => { const m = new Map(prev); m.delete(String(userId)); return m })
    }
  }

  const handleCancelRequest = async (userId) => {
    const requestId = sentRequests.get(String(userId))
    setSentRequests((prev) => { const m = new Map(prev); m.delete(String(userId)); return m })
    try {
      if (requestId) await socialService.cancelFriendRequest(requestId)
    } catch (err) {
      console.error('[JamChatMembersModal] cancel request failed:', err)
      setSentRequests((prev) => new Map(prev).set(String(userId), requestId))
    }
  }

  // ── Remove attendee ─────────────────────────────────────────────────────────

  const handleConfirmRemove = async (userId) => {
    setRemovingId(userId)
    try {
      await jamService.removeAttendee(item.id, userId)
      setAttendees((prev) => prev.filter((a) => String(a.userId) !== String(userId)))
      setConfirmRemoveId(null)
    } catch (err) {
      console.error('[JamChatMembersModal] Remove failed:', err)
    } finally {
      setRemovingId(null)
    }
  }

  // ── Toggle bringing (Coverage tab) ─────────────────────────────────────────

  const handleToggleBringing = async (field, itemName) => {
    const myEntry = attendees.find((a) => String(a.userId) === String(currentUserId))
    if (!myEntry) return

    const current    = myEntry[field] ?? []
    const amBringing = current.some((x) => x.toLowerCase() === itemName.toLowerCase())
    const next       = amBringing
      ? current.filter((x) => x.toLowerCase() !== itemName.toLowerCase())
      : [...current, itemName]

    const toggleKey = `${field}:${itemName}`
    const snapshot  = attendees

    setAttendees((prev) =>
      prev.map((a) =>
        String(a.userId) === String(currentUserId) ? { ...a, [field]: next } : a
      )
    )
    setTogglingItem(toggleKey)

    try {
      await jamService.updateMyBringing(item.id, currentUserId, {
        [SERVICE_FIELD_MAP[field]]: next,
      })
    } catch (err) {
      console.error('[JamChatMembersModal] toggle bringing failed:', err)
      setAttendees(snapshot)
    } finally {
      setTogglingItem(null)
    }
  }

  // ── Leave actions ───────────────────────────────────────────────────────────

  const handleConfirmLeaveChat = async () => {
    if (!conversationId || !currentUserId) return
    setActionLoading(true)
    try {
      await chatService.leaveJamChat(conversationId, currentUserId)
      setLeaveChatOpen(false)
      onLeaveChat?.()
      onClose()
    } catch (err) {
      console.error('[JamChatMembersModal] Leave chat failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmLeaveJam = async () => {
    if (!item?.id || !currentUserId) return
    setActionLoading(true)
    try {
      await jamService.leaveJam(item.id, currentUserId)
      setLeaveJamOpen(false)
      onLeaveJam?.()
      onClose()
    } catch (err) {
      console.error('[JamChatMembersModal] Leave jam failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Derived lists ───────────────────────────────────────────────────────────

  const friendsTabList = attendees
    .filter((a) => String(a.userId) === String(currentUserId) || friendIds.has(String(a.userId)))
    .sort((a, b) => {
      if (String(a.userId) === String(currentUserId)) return -1
      if (String(b.userId) === String(currentUserId)) return 1
      return a.displayName.localeCompare(b.displayName)
    })

  const friendAttendeeCount = attendees.filter(
    (a) => String(a.userId) !== String(currentUserId) && friendIds.has(String(a.userId))
  ).length

  const visibleAttendees = activeTab === 'friends' ? friendsTabList : attendees

  const TABS = [
    { id: 'all',      label: 'All',      count: attendees.length,    color: accent    },
    { id: 'friends',  label: 'Friends',  count: friendAttendeeCount, color: '#4ade80' },
    { id: 'coverage', label: 'Coverage', count: null,                color: '#fbb440' },
  ]

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="jcm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Panel */}
            <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
              <motion.div
                key="jcm-panel"
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="pointer-events-auto w-full sm:max-w-md flex flex-col rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
                style={{
                  background: 'rgba(18,18,18,0.98)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                  boxShadow:  `0 0 60px rgba(0,0,0,0.9), 0 0 32px ${hexToRgba(accent, 0.08)}`,
                  maxHeight:  '82vh',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <p className="text-[15px] font-bold text-white leading-tight">
                      {item?.title ?? 'Jam Members'}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(229,226,225,0.38)' }}>
                      {attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="h-11 w-11 md:h-7 md:w-7 rounded-full flex items-center justify-center transition-colors duration-150"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(229,226,225,0.5)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(229,226,225,0.5)' }}
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {/* Tabs — only when list is loaded */}
                {!loading && attendees.length > 0 && (
                  <div
                    className="flex gap-0.5 px-4 pt-2.5 pb-2 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                            color: isActive ? '#fff' : 'rgba(229,226,225,0.35)',
                          }}
                        >
                          {tab.label}
                          {tab.count !== null && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums"
                              style={{
                                background: isActive ? `${tab.color}28` : 'rgba(255,255,255,0.05)',
                                color: isActive ? tab.color : 'rgba(229,226,225,0.28)',
                              }}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: 'none' }}>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white/10 animate-spin"
                        style={{ borderTopColor: accent }}
                      />
                    </div>
                  ) : activeTab === 'coverage' ? (
                    <CoverageTab
                      item={item}
                      attendees={attendees}
                      currentUserId={currentUserId}
                      onToggleBringing={handleToggleBringing}
                      togglingItem={togglingItem}
                      isAdminMode={isAdminMode}
                    />
                  ) : visibleAttendees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <p className="text-sm font-semibold text-white">
                        {activeTab === 'friends' ? 'No friends attending yet' : 'No attendees yet'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {visibleAttendees.map((a, i) => (
                        <div
                          key={a.userId}
                          style={i < visibleAttendees.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}
                        >
                          <AttendeeRow
                            attendee={a}
                            adminId={item?.admin_id}
                            accent={accent}
                            isFriend={friendIds.has(String(a.userId))}
                            isYou={String(a.userId) === String(currentUserId)}
                            isAdminMode={isAdminMode}
                            onRemove={() => setConfirmRemoveId(a.userId)}
                            isRemoving={removingId === a.userId}
                            confirmingRemove={confirmRemoveId === a.userId}
                            onConfirmRemove={() => handleConfirmRemove(a.userId)}
                            onCancelRemove={() => setConfirmRemoveId(null)}
                            requestSent={sentRequests.has(String(a.userId))}
                            onAddFriend={() => handleAddFriend(a.userId)}
                            onCancelRequest={() => handleCancelRequest(a.userId)}
                            onOpenProfile={a.profileId ? () => { onClose?.(); ProfilesRUS(navigate, a.profileId) } : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Self-action footer — only for non-host attendees */}
                {!isAdminMode && (
                  <div
                    className="px-5 py-4 flex-shrink-0 flex flex-col gap-2.5"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Leave Jam Chat — always available */}
                    <button
                      onClick={() => setLeaveChatOpen(true)}
                      className="w-full h-10 rounded-full text-sm font-semibold transition-all duration-150"
                      style={{
                        background: 'rgba(251,64,64,0.08)',
                        color:      'rgba(251,64,64,0.8)',
                        border:     '1px solid rgba(251,64,64,0.14)',
                      }}
                    >
                      Leave Jam Chat
                    </button>

                    {/* Leave Jam — upcoming/live only */}
                    {canLeaveJam && (
                      <button
                        onClick={() => setLeaveJamOpen(true)}
                        className="w-full h-10 rounded-full text-sm font-semibold transition-all duration-150"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color:      'rgba(229,226,225,0.4)',
                          border:     '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        Leave Jam
                      </button>
                    )}

                    {isPast && (
                      <p className="text-center text-[11px]" style={{ color: 'rgba(229,226,225,0.25)' }}>
                        This jam has ended — attendance is preserved in your history
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Leave Chat confirm */}
      <DestructiveConfirmSheet
        open={leaveChatOpen}
        onClose={() => setLeaveChatOpen(false)}
        onConfirm={handleConfirmLeaveChat}
        loading={actionLoading}
        title="Leave Jam Chat?"
        body="You'll leave this chat, but you'll still be listed as attending the jam. You can rejoin the chat later until the jam ends."
        confirmLabel="Leave Chat"
      />

      {/* Leave Jam confirm */}
      <DestructiveConfirmSheet
        open={leaveJamOpen}
        onClose={() => setLeaveJamOpen(false)}
        onConfirm={handleConfirmLeaveJam}
        loading={actionLoading}
        title="Leave Jam?"
        body="You'll be removed from this jam and its chat."
        confirmLabel="Leave Jam"
      />
    </>
  )
}

export default JamChatMembersModal
