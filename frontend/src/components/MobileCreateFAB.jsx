/**
 * MobileCreateFAB — mobile-only floating action button for content creation.
 *
 * Renders a fixed pink FAB above the bottom nav. Tapping opens a bottom sheet
 * with the full creation menu (Create Jam, Promote Show, Post Update, Band).
 * Coming-soon items are visible but disabled with a "Soon" badge.
 *
 * Desktop: completely absent (md:hidden). All desktop creation surfaces are
 * untouched — the + dropdown in the Near You panel and the CreateMenu in
 * My Jams remain exactly as they are.
 *
 * Props:
 *   onCreateJam    — callback to open CreateJamModal (already auth-guarded by caller)
 *   onPromoteShow  — callback to open PromoteShowModal (already auth-guarded by caller)
 *   suppress       — when true the FAB is hidden (e.g. when filters sheet is open)
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconJam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}

function IconShow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconUpdate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconJoinBand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconFindBandmate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

// ─── Action config ────────────────────────────────────────────────────────────

const GROUPS = [
  {
    label: 'Events',
    items: [
      {
        key: 'jam',
        label: 'Create Jam',
        desc: 'Host an open or private jam session',
        icon: IconJam,
        color: '#DC2E73',
      },
      {
        key: 'show',
        label: 'Promote Show',
        desc: 'Publish a gig or live performance',
        icon: IconShow,
        color: '#F7C10D',
      },
    ],
  },
  {
    label: 'Band',
    items: [
      {
        key: 'join_band',
        label: 'Join a Band',
        desc: 'Post your profile to get discovered',
        icon: IconJoinBand,
        color: '#8B5CF6',
        soon: true,
      },
      {
        key: 'find_bandmate',
        label: 'Find a Bandmate',
        desc: "List roles you're looking for",
        icon: IconFindBandmate,
        color: '#14B8A6',
        soon: true,
      },
    ],
  },
]

// ─── Sheet row ────────────────────────────────────────────────────────────────

function ActionRow({ item, onTap }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={item.soon ? undefined : onTap}
      disabled={item.soon}
      className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors duration-150 active:bg-white/[0.04]"
      style={{
        opacity: item.soon ? 0.42 : 1,
        cursor: item.soon ? 'default' : 'pointer',
      }}
    >
      {/* Icon bubble */}
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${item.color}1a` }}
      >
        <span style={{ color: item.color }}>
          <Icon />
        </span>
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] font-semibold text-white leading-snug"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {item.label}
        </p>
        <p
          className="text-[12px] mt-0.5 leading-snug"
          style={{ color: 'rgba(229,226,225,0.42)' }}
        >
          {item.desc}
        </p>
      </div>

      {/* Soon badge */}
      {item.soon && (
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.32)',
          }}
        >
          Soon
        </span>
      )}
    </button>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function MobileCreateFAB({ onCreateJam, onPromoteShow, suppress = false }) {
  const [isOpen, setIsOpen] = useState(false)

  const close = () => setIsOpen(false)

  const handleAction = (key) => {
    close()
    if (key === 'jam') onCreateJam?.()
    if (key === 'show') onPromoteShow?.()
  }

  if (suppress) return null

  return (
    <>
      {/* FAB trigger button */}
      <button
        type="button"
        aria-label="Create"
        onClick={() => setIsOpen((v) => !v)}
        className="md:hidden fixed z-[64] w-[52px] h-[52px] rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom) + 14px)',
          right: '16px',
          background: 'linear-gradient(135deg, #DC2E73 0%, #FB4040 100%)',
          boxShadow: '0 4px 20px rgba(220,46,115,0.45), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
          }}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/50"
              onClick={close}
            />

            {/* Bottom sheet */}
            <motion.div
              key="fab-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="md:hidden fixed left-0 right-0 z-[62] rounded-t-[24px] overflow-hidden"
              style={{
                bottom: 'calc(64px + env(safe-area-inset-bottom))',
                background: 'rgba(10,10,10,0.97)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow:
                  '0 -4px 32px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.06)',
                paddingBottom: '12px',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="w-8 h-[3px] rounded-full"
                  style={{ background: 'rgba(255,255,255,0.22)' }}
                />
              </div>

              {/* Sheet header */}
              <div className="px-5 pt-2 pb-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    color: 'rgba(229,226,225,0.32)',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  Create
                </p>
              </div>

              {/* Groups */}
              {GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && (
                    <div
                      className="mx-5 my-1"
                      style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
                    />
                  )}
                  <div className="px-5 pt-1 pb-0.5">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{
                        color: 'rgba(229,226,225,0.26)',
                        fontFamily: 'Sora, sans-serif',
                      }}
                    >
                      {group.label}
                    </p>
                  </div>
                  {group.items.map((item) => (
                    <ActionRow
                      key={item.key}
                      item={item}
                      onTap={() => handleAction(item.key)}
                    />
                  ))}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
