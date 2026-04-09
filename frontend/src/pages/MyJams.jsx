/**
 * MyJams.jsx — Personal SoundMeet Dashboard
 *
 * The user's hub for managing all SoundMeet participation:
 *   Events (Jams + Shows) and Opportunities (Join a Band + Find a Bandmate)
 *
 * Tabs: Overview · Events · Opportunities · Past · Hosting
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import EventDetailModal from '../components/event-detail/EventDetailModal'
import CreateJamModal from '../components/create-jam/CreateJamModal'
import PromoteShowModal from '../components/promote-show/PromoteShowModal'
import JoinJamModal from '../components/join-jam/JoinJamModal'
import RSVPShowModal from '../components/rsvp-show/RSVPShowModal'
import {
  getDiscoveryAccentColor,
  matchesDiscoverySearch,
  hexToRgba,
  DISCOVERY_VARIANTS,
} from '../utils/discovery'
import { jamService } from '../injectables/jamService'
import { showService } from '../injectables/showService'
import { chatService } from '../injectables/chatService'
import { useAuth } from '../injectables/Auth'
import { useToast } from '../context/ToastContext.jsx'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Events', 'Opportunities', 'Past', 'Hosting']

const CHIP_SETS = {
  Overview:      [],
  Events:        [
    { key: 'all',        label: 'All' },
    { key: 'jams',       label: 'Jams' },
    { key: 'shows',      label: 'Shows' },
    { key: 'going_soon', label: 'Going Soon' },
    { key: 'hosting',    label: 'Hosting' },
  ],
  Opportunities: [
    { key: 'all',       label: 'All' },
    { key: 'join_band', label: 'Join a Band' },
    { key: 'find_bandmate', label: 'Find a Bandmate' },
    { key: 'interested',   label: 'Interested / Applied' },
    { key: 'posted',       label: 'Posted by You' },
  ],
  Past: [
    { key: 'all',          label: 'All' },
    { key: 'events',       label: 'Events' },
    { key: 'opportunities',label: 'Opportunities' },
    { key: 'hosted',       label: 'Hosted' },
    { key: 'participated', label: 'Participated' },
  ],
  Hosting: [
    { key: 'all',          label: 'All' },
    { key: 'jams',         label: 'Jams' },
    { key: 'shows',        label: 'Shows' },
    { key: 'join_band',    label: 'Join a Band' },
    { key: 'find_bandmate',label: 'Find a Bandmate' },
  ],
}

// ─────────────────────────────────────────────────────────────
// Layout primitive
// ─────────────────────────────────────────────────────────────

function ContentWrap({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared badge / pill / chip primitives
// ─────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const variant = DISCOVERY_VARIANTS[type] ?? DISCOVERY_VARIANTS.jam
  const color = variant.accentColor
  return (
    <span
      className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
      style={{ color, background: hexToRgba(color, 0.14) }}
    >
      {variant.label}
    </span>
  )
}

function StatusPill({ item }) {
  const isLive = item?.timeSlot === 'live' || item?.isLive
  const isCreator = item?.canEdit
  const isAttendee = item?.isAttendee

  if (isLive) return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
      style={{ color: '#FB4040', background: 'rgba(251,64,64,0.12)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#FB4040] animate-pulse inline-block" />
      Live
    </span>
  )
  if (isCreator) return (
    <span
      className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
      style={{ color: '#DC2E73', background: 'rgba(220,46,115,0.10)' }}
    >
      Hosting
    </span>
  )
  if (isAttendee) return (
    <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full text-neutral-400 bg-neutral-800">
      Going
    </span>
  )
  return null
}

function SectionHeading({ title, count, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-3 w-0.5 bg-[#DC2E73] rounded-full shrink-0" />
      <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.09em]">{title}</h2>
      {count != null && count > 0 && (
        <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-800 border border-white/[0.06] px-2 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="ml-auto text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

function FilterChips({ chips, active, onChange }) {
  if (!chips?.length) return null
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {chips.map(chip => (
        <button
          key={chip.key}
          onClick={() => onChange(chip.key)}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
            active === chip.key
              ? 'bg-[#DC2E73]/15 border-[#DC2E73]/35 text-[#DC2E73]'
              : 'border-white/[0.08] text-neutral-500 hover:text-neutral-300 hover:border-white/15'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}

// ─── Empty state icons ────────────────────────────────────────
const EmptyIcons = {
  musicNote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  waveform: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-8 h-8 text-neutral-700">
        {icon}
      </div>
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      {subtitle && <p className="text-xs text-neutral-700 max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Card display modes
// ─────────────────────────────────────────────────────────────

const FEATURED_TIME_LABELS = {
  live:     'Happening Now',
  tonight:  'Tonight',
  tomorrow: 'Tomorrow',
  week:     'This Week',
}

/** Overview > Up Next — full-featured event card. First item gets isFeatured treatment. */
function FeaturedEventCard({ item, onOpen, isFeatured = false }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  const timeLabel = isFeatured ? (FEATURED_TIME_LABELS[item.timeSlot] ?? null) : null

  return (
    <button
      onClick={() => onOpen(item)}
      className={`group relative w-full h-full rounded-2xl border p-5 text-left
                 transition-all duration-200 hover:scale-[1.01] transform-gpu overflow-hidden
                 ${isFeatured
                   ? 'border-white/[0.12] bg-neutral-900/80 hover:border-white/[0.22]'
                   : 'border-white/[0.07] bg-neutral-900/60 hover:border-white/[0.16] hover:bg-neutral-900/80'
                 }`}
    >
      {/* Accent gradient — always-on for featured, hover-only for rest */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-2xl ${
          isFeatured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ background: `linear-gradient(135deg, ${hexToRgba(color, isFeatured ? 0.10 : 0.07)} 0%, transparent 65%)` }}
      />
      <div className="relative flex flex-col h-full">

        {/* Badge row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold"
              style={{ background: hexToRgba(color, 0.18), color }}
            >
              {glyph}
            </div>
            <TypeBadge type={item.type} />
          </div>
          <StatusPill item={item} />
        </div>

        {/* Time context label — featured only, appears above title */}
        {timeLabel && (
          <p
            className="text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5"
            style={{ color }}
          >
            {timeLabel}
          </p>
        )}

        {/* Title */}
        <h3 className={`font-bold text-white leading-snug line-clamp-2 ${isFeatured ? 'text-[15px] mb-2' : 'text-[13px] mb-1.5'}`}>
          {item.title}
        </h3>

        {/* Primary metadata */}
        <div className="flex-1 space-y-0.5">
          {item.dateTime && (
            <p className="text-xs text-neutral-400">{item.dateTime}</p>
          )}
          {item.locationName && (
            <p className="text-[11px] text-neutral-600">{item.locationName}</p>
          )}
          {/* Description — featured only */}
          {isFeatured && item.description && (
            <p className="text-xs text-neutral-500 pt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer CTA — separator on featured */}
        <div className={`flex items-center justify-end mt-3 ${isFeatured ? 'pt-3 border-t border-white/[0.06]' : ''}`}>
          <span
            className={`text-[11px] font-semibold transition-opacity duration-200 ${
              isFeatured ? 'opacity-45 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{ color }}
          >
            {isFeatured ? 'View details →' : 'View →'}
          </span>
        </div>

      </div>
    </button>
  )
}

/** Events tab — compact grid card */
function CompactEventCard({ item, onOpen }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  const dateLine = item.dateTime ?? item.metaSecondary ?? item.date

  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative w-full rounded-2xl border border-white/[0.07] bg-neutral-800/50 p-4 text-left
                 transition-all duration-200 hover:border-white/[0.16] hover:bg-neutral-800/70
                 hover:scale-[1.015] transform-gpu overflow-hidden"
    >
      {/* Left-edge type accent — subtle Jam vs Show differentiation */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full opacity-35 transition-opacity duration-200 group-hover:opacity-60"
        style={{ background: color }}
      />
      <div className="pl-1">
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ background: hexToRgba(color, 0.14), color }}
          >
            {glyph}
          </div>
          <TypeBadge type={item.type} />
          <div className="ml-auto">
            <StatusPill item={item} />
          </div>
        </div>
        <h3 className="text-[13px] font-bold text-white mb-2 leading-snug line-clamp-2">{item.title}</h3>
        {dateLine && (
          <p className="text-[11px] text-neutral-400 leading-tight">{dateLine}</p>
        )}
        {item.locationName && (
          <p className="text-[10px] text-neutral-600 mt-0.5 truncate">{item.locationName}</p>
        )}
      </div>
    </button>
  )
}

/** Past tab — archive card */
function ArchiveCard({ item, onOpen }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'
  return (
    <button
      onClick={() => onOpen(item)}
      className="w-full rounded-xl border border-white/[0.06] bg-neutral-800/40 p-4 text-left
                 hover:border-white/[0.12] hover:bg-neutral-800/60 transition-all duration-200
                 hover:scale-[1.01] transform-gpu"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: hexToRgba(color, 0.12), color }}
        >
          {glyph}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-white leading-tight">{item.title}</h3>
            <span className="text-[10px] text-neutral-600 shrink-0">{item.date}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={item.type} />
            {item.rating != null && (
              <span className="text-[11px]" style={{ color }}>
                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/** Hosting tab — premium management row */
function HostingManageRow({ item, onOpen, onEdit, compact = false }) {
  const color = getDiscoveryAccentColor(item)
  const glyph = DISCOVERY_VARIANTS[item.type]?.markerGlyph ?? 'J'

  return (
    <div
      onClick={() => onOpen(item)}
      className="group flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-white/[0.02]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold"
          style={{ background: hexToRgba(color, 0.12), color }}
        >
          {glyph}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
            <TypeBadge type={item.type} />
          </div>
          <p className="text-[11px] text-neutral-500">
            {[item.date, item.locationName ?? item.subtitle].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {!compact && item.canEdit && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item) }}
            className="text-xs font-medium text-neutral-500 border border-white/[0.08] rounded-full px-3 py-1
                       transition-all duration-150 group-hover:text-[#DC2E73] group-hover:border-[#DC2E73]/30"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(item) }}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-300 transition-colors duration-150 px-2 py-1"
          >
            Manage
          </button>
        </div>
      )}
      {compact && (
        <span
          className="shrink-0 text-[10px] font-medium text-neutral-700 group-hover:text-[#DC2E73]/70 transition-colors duration-150"
        >
          →
        </span>
      )}
    </div>
  )
}

const OPPORTUNITY_COPY = {
  join_band: {
    forLabel: 'For musicians',
    tagline: 'Find your musical home.',
    desc: 'Post your profile — what you play, your style, and your availability — and get discovered by bands actively looking for the right fit.',
    // SVG: single person = individual musician
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  find_bandmate: {
    forLabel: 'For bands & projects',
    tagline: 'Build your lineup.',
    desc: 'Describe your project and the role you need. The right musician will reach out when the fit is right.',
    // SVG: two people = group / band
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
        <circle cx="17" cy="8" r="3.5" />
        <path d="M16 14.1c1.1-.07 2.2.2 3 .9 1.2.9 2 2.4 2 4" />
      </svg>
    ),
  },
}

/** Band opportunity scaffold — intentional product state card */
function OpportunityScaffoldCard({ type }) {
  const variant = DISCOVERY_VARIANTS[type] ?? DISCOVERY_VARIANTS.join_band
  const color = variant.accentColor
  const copy = OPPORTUNITY_COPY[type] ?? OPPORTUNITY_COPY.join_band

  return (
    <div
      className="rounded-2xl border border-white/[0.07] p-5 flex flex-col gap-4 h-full"
      style={{ background: `linear-gradient(135deg, ${hexToRgba(color, 0.04)} 0%, rgba(18,18,18,0.6) 70%)` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: hexToRgba(color, 0.14), color }}
          >
            <div className="w-[18px] h-[18px]">{copy.icon}</div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-tight">{variant.label}</p>
            <p className="text-[10px] font-medium text-neutral-600 mt-0.5 leading-tight">{copy.forLabel}</p>
          </div>
        </div>
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.10em] px-2 py-1 rounded-full border border-white/[0.08] text-neutral-600 bg-neutral-800/50">
          Coming Soon
        </span>
      </div>

      {/* Tagline + Description */}
      <div className="flex-1 space-y-1.5">
        <p className="text-[12px] font-semibold leading-snug" style={{ color }}>{copy.tagline}</p>
        <p className="text-[12px] text-neutral-500 leading-relaxed">{copy.desc}</p>
      </div>

      {/* Action */}
      <button
        disabled
        className="w-full text-[11px] font-medium py-2.5 rounded-xl border border-white/[0.07] text-neutral-600 cursor-not-allowed select-none transition-colors"
      >
        Notify me when available
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab content components
// ─────────────────────────────────────────────────────────────

function OverviewTab({ upcomingItems, createdItems, pastItems, onOpen, onEditItem, searchQuery = '' }) {
  const q = searchQuery.trim().toLowerCase()
  const matchSearch = (item) => !q || matchesDiscoverySearch(item, q)

  const upNext       = upcomingItems.filter(matchSearch).slice(0, 5)
  const hostingItems = createdItems.filter(matchSearch).slice(0, 8)
  const recentPast   = pastItems.filter(matchSearch).slice(0, 4)

  const hasContent = upNext.length > 0 || hostingItems.length > 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="pt-7 pb-28 space-y-9">

        {/* ── Up Next ── */}
        <ContentWrap>
          <SectionHeading title="Up Next" count={upNext.length || null} />
          {upNext.length === 0 ? (
            <EmptyState
              icon={q ? EmptyIcons.search : EmptyIcons.musicNote}
              title={q ? 'No matches' : 'Nothing coming up yet'}
              subtitle={q ? `No upcoming events match "${searchQuery}"` : 'Join a jam or RSVP to a show to see it here'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upNext.map((item, idx) => (
                <div
                  key={item.id}
                  className={idx === 0 && upNext.length > 1 ? 'sm:col-span-2 lg:col-span-2' : ''}
                >
                  <FeaturedEventCard item={item} onOpen={onOpen} isFeatured={idx === 0} />
                </div>
              ))}
            </div>
          )}
        </ContentWrap>

        {/* ── Band Opportunities scaffold ── */}
        <ContentWrap>
          <SectionHeading title="Band Opportunities" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OpportunityScaffoldCard type="join_band" />
            <OpportunityScaffoldCard type="find_bandmate" />
          </div>
        </ContentWrap>

        {/* ── Hosting & Managing ── */}
        {hostingItems.length > 0 && (
          <ContentWrap>
            <SectionHeading title="Hosting & Managing" count={hostingItems.length} />
            <div className="rounded-2xl border border-white/[0.07] bg-neutral-900/50 overflow-hidden">
              {hostingItems.map(item => (
                <HostingManageRow
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  onEdit={onEditItem}
                  compact
                />
              ))}
            </div>
          </ContentWrap>
        )}

        {/* ── Recent Past Activity ── */}
        {recentPast.length > 0 && (
          <ContentWrap>
            <SectionHeading title="Recent Past Activity" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {recentPast.map(item => (
                <ArchiveCard key={item.id} item={item} onOpen={onOpen} />
              ))}
            </div>
          </ContentWrap>
        )}

        {/* First-time empty state */}
        {!hasContent && recentPast.length === 0 && (
          <ContentWrap>
            <EmptyState
              icon={EmptyIcons.waveform}
              title="Your dashboard is empty"
              subtitle="Create a jam, RSVP to a show, or post a band opportunity to get started"
            />
          </ContentWrap>
        )}

      </div>
    </div>
  )
}

function EventsTab({ upcomingItems, createdItems, chipFilter, onChipChange, onOpen, searchQuery }) {
  const now = Date.now() - 4 * 60 * 60 * 1000

  // Upcoming items the user is hosting (from createdItems, filtered to future)
  const upcomingHosting = createdItems.filter(item =>
    !item.dateTimeRaw || new Date(item.dateTimeRaw).getTime() >= now
  )

  const source = chipFilter === 'hosting' ? upcomingHosting : upcomingItems

  const visible = source.filter(item => {
    if (searchQuery && !matchesDiscoverySearch(item, searchQuery)) return false
    if (chipFilter === 'jams')       return item.type === 'jam'
    if (chipFilter === 'shows')      return item.type === 'promote_show'
    if (chipFilter === 'going_soon') return ['tonight', 'tomorrow', 'week', 'live'].includes(item.timeSlot)
    return true
  })

  const emptyMessages = {
    all:        { title: 'No upcoming events', subtitle: 'Join a jam or RSVP to a show' },
    jams:       { title: 'No upcoming jams', subtitle: 'Browse and join a jam to see it here' },
    shows:      { title: 'No upcoming shows', subtitle: 'RSVP to a show to see it here' },
    going_soon: { title: 'Nothing happening soon', subtitle: 'Events happening tonight, tomorrow, or this week will appear here' },
    hosting:    { title: "You're not hosting any upcoming events", subtitle: 'Create a jam or promote a show to manage it here' },
  }

  const empty = emptyMessages[chipFilter] ?? emptyMessages.all

  return (
    <div className="h-full overflow-y-auto">
      <ContentWrap className="pt-6 pb-28">
        <FilterChips chips={CHIP_SETS.Events} active={chipFilter} onChange={onChipChange} />
        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState icon={searchQuery ? EmptyIcons.search : EmptyIcons.calendar} title={empty.title} subtitle={empty.subtitle} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(item => (
                <CompactEventCard key={item.id} item={item} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      </ContentWrap>
    </div>
  )
}

function OpportunitiesTab({ chipFilter, onChipChange }) {
  return (
    <div className="h-full overflow-y-auto">
      <ContentWrap className="pt-6 pb-28">
        <FilterChips chips={CHIP_SETS.Opportunities} active={chipFilter} onChange={onChipChange} />
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <OpportunityScaffoldCard type="join_band" />
          <OpportunityScaffoldCard type="find_bandmate" />
        </div>
      </ContentWrap>
    </div>
  )
}

function PastTab({ pastItems, chipFilter, onChipChange, onOpen, searchQuery }) {
  const visible = pastItems.filter(item => {
    if (searchQuery && !matchesDiscoverySearch(item, searchQuery)) return false
    if (chipFilter === 'events')        return item.type === 'jam' || item.type === 'promote_show'
    if (chipFilter === 'opportunities') return item.type === 'join_band' || item.type === 'find_bandmate'
    if (chipFilter === 'hosted')        return item.canEdit === true
    if (chipFilter === 'participated')  return item.canEdit !== true
    return true
  })

  return (
    <div className="h-full overflow-y-auto">
      <ContentWrap className="pt-6 pb-28">
        <FilterChips chips={CHIP_SETS.Past} active={chipFilter} onChange={onChipChange} />
        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState
              icon={searchQuery ? EmptyIcons.search : EmptyIcons.history}
              title={searchQuery ? 'No results' : 'No past activity'}
              subtitle={searchQuery ? 'Try a different search' : 'Completed jams, shows, and events will appear here'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visible.map(item => (
                <ArchiveCard key={item.id} item={item} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      </ContentWrap>
    </div>
  )
}

function HostingTab({ createdItems, chipFilter, onChipChange, onOpen, onEditItem, searchQuery }) {
  const visible = createdItems.filter(item => {
    if (searchQuery && !matchesDiscoverySearch(item, searchQuery)) return false
    if (chipFilter === 'jams')          return item.type === 'jam'
    if (chipFilter === 'shows')         return item.type === 'promote_show'
    if (chipFilter === 'join_band')     return item.type === 'join_band'
    if (chipFilter === 'find_bandmate') return item.type === 'find_bandmate'
    return true
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        <FilterChips chips={CHIP_SETS.Hosting} active={chipFilter} onChange={onChipChange} />
        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState
              icon={searchQuery ? EmptyIcons.search : EmptyIcons.mic}
              title={searchQuery ? 'No results' : "You haven't created anything yet"}
              subtitle={searchQuery ? 'Try a different search' : 'Create a jam or promote a show to manage it here'}
            />
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-neutral-900/50 overflow-hidden">
              {visible.map(item => (
                <HostingManageRow
                  key={item.id}
                  item={item}
                  onOpen={onOpen}
                  onEdit={onEditItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Create menu
// ─────────────────────────────────────────────────────────────

function CreateMenu({ onCreateJam, onPromoteShow }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const options = [
    {
      group: 'Events',
      items: [
        {
          key: 'jam',
          label: 'Create Jam',
          desc: 'Host an open or private jam session',
          glyph: 'J',
          color: '#DC2E73',
          onClick: () => { setOpen(false); onCreateJam() },
        },
        {
          key: 'show',
          label: 'Promote Show',
          desc: 'Publish a gig or live performance',
          glyph: 'S',
          color: '#F7C10D',
          onClick: () => { setOpen(false); onPromoteShow() },
        },
      ],
    },
    {
      group: 'Band Opportunities',
      items: [
        {
          key: 'join_band',
          label: 'Join a Band',
          desc: 'Post your musician profile to get discovered',
          glyph: 'B',
          color: '#8B5CF6',
          soon: true,
        },
        {
          key: 'find_bandmate',
          label: 'Find a Bandmate',
          desc: 'List what roles you\'re looking for',
          glyph: 'F',
          color: '#14B8A6',
          soon: true,
        },
      ],
    },
  ]

  return (
    <div ref={menuRef} className="relative">
      {/* Dropdown panel */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-2xl border border-white/[0.10] bg-neutral-900/95 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden z-20">
          {options.map((group, gi) => (
            <div key={group.group}>
              {gi > 0 && <div className="mx-4 border-t border-white/[0.05]" />}
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                  {group.group}
                </p>
              </div>
              {group.items.map(opt => (
                <button
                  key={opt.key}
                  onClick={opt.soon ? undefined : opt.onClick}
                  disabled={opt.soon}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                    opt.soon
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/[0.035] cursor-pointer'
                  }`}
                >
                  <div
                    className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: hexToRgba(opt.color, 0.14), color: opt.color }}
                  >
                    {opt.glyph}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      {opt.soon && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-700">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
          <div className="pb-2" />
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[#DC2E73] hover:bg-[#c4265a] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md shadow-[#DC2E73]/15 transition-all duration-200 hover:shadow-[#DC2E73]/30 hover:scale-[1.02] transform-gpu"
      >
        <span className="text-base leading-none">+</span>
        Create
        <span className={`text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

const MyJams = () => {
  const { user, isLoggedIn } = useAuth()
  const { showToast } = useToast()

  const [activeTab,   setActiveTab]   = useState('Overview')
  const [chipFilter,  setChipFilter]  = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [discoveryModal,  setDiscoveryModal]  = useState({ open: false, item: null, openedFrom: null })
  const [editingJam,      setEditingJam]      = useState(null)
  const [createOpen,      setCreateOpen]      = useState(false)
  const [promoteShowOpen, setPromoteShowOpen] = useState(false)
  const [joinJamModal,    setJoinJamModal]    = useState({ open: false, jam: null })
  const [rsvpShowModal,   setRsvpShowModal]   = useState({ open: false, show: null })

  // Data
  const [upcomingItems, setUpcomingItems] = useState([])
  const [pastItems,     setPastItems]     = useState([])
  const [createdItems,  setCreatedItems]  = useState([])
  const [tabLoading,    setTabLoading]    = useState(false)

  // ── Data loading ────────────────────────────────────────────

  const loadTab = useCallback(async (tab) => {
    if (!isLoggedIn || !user?.id) return
    setTabLoading(true)
    try {
      if (tab === 'Overview') {
        // Load all three in parallel for the dashboard view
        const [up, cr, pa] = await Promise.all([
          jamService.getMyAttendingJams(user.id),
          jamService.getMyCreatedJams(user.id),
          jamService.getMyPastJams(user.id),
        ])
        setUpcomingItems(up)
        setCreatedItems(cr)
        setPastItems(pa)
      } else if (tab === 'Events') {
        // Load attending + created so the "Hosting" chip works without a second fetch
        const [up, cr] = await Promise.all([
          jamService.getMyAttendingJams(user.id),
          jamService.getMyCreatedJams(user.id),
        ])
        setUpcomingItems(up)
        setCreatedItems(cr)
      } else if (tab === 'Past') {
        const items = await jamService.getMyPastJams(user.id)
        setPastItems(items)
      } else if (tab === 'Hosting') {
        const items = await jamService.getMyCreatedJams(user.id)
        setCreatedItems(items)
      }
      // Opportunities: no backend calls yet
    } catch (err) {
      console.error('[MyJams] Failed to load tab:', tab, err)
    } finally {
      setTabLoading(false)
    }
  }, [isLoggedIn, user?.id])

  useEffect(() => {
    setChipFilter('all')
    loadTab(activeTab)
  }, [activeTab, loadTab])

  // ── Modal dispatch ──────────────────────────────────────────

  const openItem = (item) => setDiscoveryModal({ open: true, item, openedFrom: activeTab })

  const getViewerContext = (tab, item) => {
    if (tab === 'Hosting')     return { isCreator: item?.canEdit ?? true }
    if (tab === 'Events')      return { isAttendee: true }
    if (tab === 'Past')        return { isAttendee: true, isPastEvent: true }
    if (tab === 'Overview') {
      if (item?.canEdit)       return { isCreator: true }
      if (item?.isAttendee)    return { isAttendee: true }
    }
    if (user?.id && item?.admin_id && String(item.admin_id) === String(user.id)) {
      return { isCreator: true }
    }
    return {}
  }

  // ── Mutation handlers ───────────────────────────────────────

  const handleDelete = async (item) => {
    try {
      if (item?.type === 'jam') {
        await jamService.deleteJam(item.id)
        chatService.deleteJamConversation(item.id).catch(() => {})
        setCreatedItems(prev => prev.filter(j => j.id !== item.id))
        setUpcomingItems(prev => prev.filter(j => j.id !== item.id))
        showToast('Jam and chat deleted', 'success')
      } else if (item?.type === 'promote_show') {
        await showService.deleteShow(item.id)
        setCreatedItems(prev => prev.filter(s => s.id !== item.id))
        setUpcomingItems(prev => prev.filter(s => s.id !== item.id))
        showToast('Event deleted', 'success')
      }
    } catch (err) {
      console.error('[MyJams] Delete failed:', err)
      showToast('Failed to delete event. Please try again.', 'error')
      throw err
    }
  }

  const handleLeave = async (item) => {
    if (!user?.id) return
    try {
      if (item?.type === 'jam') {
        await jamService.leaveJam(item.id, user.id)
        setUpcomingItems(prev => prev.filter(j => j.id !== item.id))
        showToast('You left the jam', 'success')
      } else if (item?.type === 'promote_show') {
        await showService.cancelShowRsvp(item.id, user.id)
        setUpcomingItems(prev => prev.filter(s => s.id !== item.id))
        showToast('You left the event', 'success')
      }
    } catch (err) {
      console.error('[MyJams] Leave failed:', err)
      showToast('Failed to leave event. Please try again.', 'error')
      throw err
    }
  }

  const handleEditItem = (item) => {
    if (item?.type === 'promote_show') return // Show editing not yet supported
    setEditingJam(item)
    setCreateOpen(true)
  }

  const editInitialValues = editingJam ? {
    title:          editingJam.title ?? '',
    description:    editingJam.description ?? '',
    isPrivate:      editingJam.isPrivate ?? false,
    maxParticipants:editingJam.maxParticipants != null ? String(editingJam.maxParticipants) : '',
    locationQuery:  editingJam.locationName ?? editingJam.location ?? editingJam.subtitle ?? '',
  } : undefined

  // ── Search filter ────────────────────────────────────────────

  const filtered = (items) =>
    searchQuery.trim() ? items.filter(i => matchesDiscoverySearch(i, searchQuery)) : items

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-4rem)] text-white flex flex-col relative overflow-hidden">

      {/* ── Page header ── */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <ContentWrap className="!px-0">

          {/* ── Identity area: title + subtitle + stats + search ── */}
          <div className="flex items-start justify-between gap-6 px-4 sm:px-6 lg:px-8 pt-7 pb-5">
            <div className="min-w-0">
              <h1 className="text-[26px] font-bold text-white tracking-tight leading-none">
                My Jams
              </h1>
              <p className="text-sm text-neutral-400 mt-2 leading-snug max-w-sm">
                Manage everything you're joining, hosting, and posting on SoundMeet.
              </p>
              {/* Quick stats — KPI-style: large number + uppercase label */}
              <div className="flex items-center mt-4 select-none">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[18px] font-bold text-white leading-none tabular-nums">{upcomingItems.length}</span>
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.10em]">Upcoming</span>
                </div>
                <div className="w-px h-5 bg-white/[0.07] mx-5" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[18px] font-bold text-white leading-none tabular-nums">{pastItems.length}</span>
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.10em]">Past</span>
                </div>
                <div className="w-px h-5 bg-white/[0.07] mx-5" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[18px] font-bold text-white leading-none tabular-nums">{createdItems.length}</span>
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.10em]">Hosting</span>
                </div>
              </div>
              {/* Contextual next-event intelligence line */}
              {(() => {
                const next = upcomingItems[0]
                if (!next) return null
                const typeLabel = DISCOVERY_VARIANTS[next.type]?.label?.toLowerCase() ?? 'event'
                const msgMap = {
                  live:     `A ${typeLabel} is happening right now`,
                  tonight:  `You have a ${typeLabel} tonight`,
                  tomorrow: `You have a ${typeLabel} tomorrow`,
                }
                const msg = msgMap[next.timeSlot] ?? (next.dateTime ? `Next up: ${next.title}` : null)
                if (!msg) return null
                return (
                  <p className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-500">
                    <span className="w-1 h-1 rounded-full bg-[#DC2E73] shrink-0 inline-block" />
                    {msg}
                  </p>
                )
              })()}
            </div>

            {/* Search — self-end baseline-aligns with the stats row */}
            <div className="self-end shrink-0 flex items-center gap-2.5 bg-neutral-800/60 border border-white/[0.08] rounded-full px-4 py-2.5 w-[160px] sm:w-[230px] lg:w-[272px] transition-all duration-200 focus-within:border-[#DC2E73]/30 focus-within:bg-neutral-800/90 focus-within:shadow-[0_0_0_3px_rgba(220,46,115,0.07)]">
              <i className="fa-solid fa-magnifying-glass text-neutral-500 text-[11px] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your activity..."
                aria-label="Search your activity"
                className="bg-transparent text-[13px] text-white placeholder:text-neutral-500 focus:outline-none flex-1 min-w-0 leading-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-150"
                  aria-label="Clear search"
                >
                  <span className="text-[11px] text-neutral-300 leading-none">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Soft divider between identity area and navigation */}
          <div className="mx-4 sm:mx-6 lg:mx-8 h-px bg-white/[0.04]" />

          {/* ── Tab bar ── */}
          <div className="flex overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 px-4 py-3.5 text-sm transition-colors duration-150 ${
                  activeTab === tab ? 'text-white font-semibold' : 'text-neutral-600 font-medium hover:text-neutral-400'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#DC2E73] rounded-full" />
                )}
              </button>
            ))}
          </div>

        </ContentWrap>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* Gradient bridge — softens the hard header/content boundary */}
        <div className="absolute top-0 inset-x-0 h-5 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none z-[1]" />

        {/* Loading spinner */}
        {tabLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
          </div>
        )}

        {activeTab === 'Overview' && (
          <OverviewTab
            upcomingItems={upcomingItems}
            createdItems={createdItems}
            pastItems={pastItems}
            onOpen={openItem}
            onEditItem={handleEditItem}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'Events' && (
          <EventsTab
            upcomingItems={upcomingItems}
            createdItems={createdItems}
            chipFilter={chipFilter}
            onChipChange={setChipFilter}
            onOpen={openItem}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'Opportunities' && (
          <OpportunitiesTab
            chipFilter={chipFilter}
            onChipChange={setChipFilter}
          />
        )}

        {activeTab === 'Past' && (
          <PastTab
            pastItems={filtered(pastItems)}
            chipFilter={chipFilter}
            onChipChange={setChipFilter}
            onOpen={openItem}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'Hosting' && (
          <HostingTab
            createdItems={filtered(createdItems)}
            chipFilter={chipFilter}
            onChipChange={setChipFilter}
            onOpen={openItem}
            onEditItem={handleEditItem}
            searchQuery={searchQuery}
          />
        )}

      </div>

      {/* ── Floating create menu ── */}
      <div className="absolute bottom-5 right-4 sm:bottom-6 sm:right-6 lg:right-8 z-10">
        <CreateMenu
          onCreateJam={() => setCreateOpen(true)}
          onPromoteShow={() => setPromoteShowOpen(true)}
        />
      </div>

      {/* ── Modals ── */}

      <EventDetailModal
        item={discoveryModal.item}
        open={discoveryModal.open}
        onClose={() => setDiscoveryModal({ open: false, item: null, openedFrom: null })}
        viewerContext={getViewerContext(discoveryModal.openedFrom, discoveryModal.item)}
        openedFrom="my-jams"
        onJoin={() => {
          const item = discoveryModal.item
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          if (item?.type === 'jam') {
            setJoinJamModal({
              open: true,
              jam: {
                id: item.id,
                title: item.title,
                isPrivate: !!item.isPrivate,
                dateTime: item.dateTime ?? item.metaSecondary ?? null,
                locationLabel: item.locationName ?? item.subtitle ?? null,
              },
            })
          }
        }}
        onRsvp={() => {
          const item = discoveryModal.item
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          if (item?.type === 'promote_show') {
            setRsvpShowModal({ open: true, show: item })
          }
        }}
        onEdit={(item) => {
          setDiscoveryModal({ open: false, item: null, openedFrom: null })
          if (item?.type === 'promote_show') return // Show editing not yet supported
          setEditingJam(item)
          setCreateOpen(true)
        }}
        onDelete={handleDelete}
        onLeave={handleLeave}
        onRate={(item, rating) => {
          setPastItems(prev =>
            prev.map(p => p.id === item.id ? { ...p, rating } : p)
          )
          setDiscoveryModal(prev =>
            prev.item?.id === item.id
              ? { ...prev, item: { ...prev.item, rating } }
              : prev
          )
        }}
      />

      <JoinJamModal
        isOpen={joinJamModal.open}
        onClose={() => setJoinJamModal({ open: false, jam: null })}
        jam={joinJamModal.jam}
      />

      <RSVPShowModal
        isOpen={rsvpShowModal.open}
        onClose={() => setRsvpShowModal({ open: false, show: null })}
        show={rsvpShowModal.show}
        accentColor={rsvpShowModal.show?.accentColor}
        onSubmit={() => showService.rsvpShow(rsvpShowModal.show?.id, user?.id)}
        onSuccessNavigateToMyJams={() => {
          setActiveTab('Events')
          loadTab('Events')
        }}
      />

      <CreateJamModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setEditingJam(null)
            loadTab(activeTab)
          }
        }}
        initialValues={editInitialValues}
      />

      <PromoteShowModal
        open={promoteShowOpen}
        onOpenChange={(open) => {
          setPromoteShowOpen(open)
          if (!open) loadTab(activeTab)
        }}
      />

    </div>
  )
}

export default MyJams
