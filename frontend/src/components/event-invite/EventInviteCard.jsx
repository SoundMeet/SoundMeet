import { useState } from 'react';
import { useEventPreview } from '../../hooks/useEventPreview';
import { hexToRgba, getDiscoveryAccentColor, getDiscoveryVariant } from '../../utils/discovery';
import { extractHostDisplay } from '../../utils/eventComputed';
import EventDetailModal from '../event-detail/EventDetailModal';
import { useAuth } from '../../injectables/Auth';

// ── Inline SVG icons ───────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PinIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Loading skeleton ───────────────────────────────────────────────────────────

function InviteSkeleton({ compact }) {
  const imgSize = compact ? 52 : 80;
  const pad = compact ? '10px 12px' : '14px';
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: pad }}
    >
      <div className="flex gap-3 items-start">
        <div
          className="shrink-0 rounded-xl"
          style={{ width: imgSize, height: imgSize, background: 'rgba(255,255,255,0.07)' }}
        />
        <div className="flex-1 min-w-0 space-y-2 pt-0.5">
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', width: '32%' }} />
          <div className="h-[14px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)', width: '78%' }} />
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '55%' }} />
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '42%' }} />
        </div>
      </div>
    </div>
  );
}

// ── Unavailable state ──────────────────────────────────────────────────────────

function UnavailableCard({ compact }) {
  const pad = compact ? '10px 12px' : '14px';
  return (
    <div
      className="rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: pad }}
    >
      <p className="text-[11px]" style={{ color: 'rgba(229,226,225,0.3)' }}>
        This event is no longer available.
      </p>
    </div>
  );
}

// ── Meta row ───────────────────────────────────────────────────────────────────

function MetaRow({ icon, children }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="shrink-0 mt-[2px]" style={{ color: 'rgba(229,226,225,0.28)' }}>{icon}</span>
      <span
        className="text-[11px] leading-snug min-w-0 truncate"
        style={{ color: 'rgba(229,226,225,0.48)' }}
      >
        {children}
      </span>
    </div>
  );
}

// ── Card body (image + info) ───────────────────────────────────────────────────
// Does not render the CTA — that lives in the outer wrapper for non-compact interactive cards.

function CardBody({ item, compact, accent, variant }) {
  const isPrivate = !!item.isPrivate;
  const isShow    = item.type === 'promote_show';
  const coverUrl  = item.coverImageUrl ?? null;

  // Square image: 80px feed, 52px chat
  const imgSize = compact ? 52 : 80;

  const dateStr = item.dateTimeRaw
    ? new Date(item.dateTimeRaw).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : item.dateTime ?? item.date ?? null;
  const timeStr = item.dateTimeRaw
    ? new Date(item.dateTimeRaw).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      })
    : null;
  const dateTimeStr = [dateStr, timeStr].filter(Boolean).join(' · ');

  const hostName = extractHostDisplay(item);

  const locationDisplay = isPrivate
    ? (item.locationName ?? item.neighborhood ?? null)
    : (item.locationName ?? item.venueName ?? item.neighborhood ?? item.locationAddress ?? null);
  const showPrivateNotice = isPrivate && !locationDisplay;

  // First letter of title for placeholder
  const initial = item.title?.[0]?.toUpperCase() ?? (isShow ? 'S' : 'J');

  return (
    <div className="flex gap-3 items-start">
      {/* Cover / poster */}
      <div
        className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center select-none"
        style={{
          width: imgSize,
          height: imgSize,
          background: coverUrl
            ? undefined
            : `linear-gradient(150deg, ${hexToRgba(accent, 0.7)}, ${hexToRgba(accent, 0.18)})`,
          border: `1px solid ${hexToRgba(accent, 0.18)}`,
          flexShrink: 0,
        }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" aria-hidden="true" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span
            style={{
              fontSize: compact ? 20 : 28,
              fontWeight: 800,
              color: isShow ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.75)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {initial}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Type + privacy */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span
            className="inline-flex items-center h-4 px-1.5 rounded text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: accent,
              background: hexToRgba(accent, 0.15),
            }}
          >
            {variant.label}
          </span>
          {isPrivate && (
            <span
              className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded text-[9px] font-medium"
              style={{
                color: 'rgba(229,226,225,0.38)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <LockIcon />
              Private
            </span>
          )}
        </div>

        {/* Title */}
        <p
          className="font-semibold leading-snug truncate"
          style={{ fontSize: compact ? 13 : 15, color: '#E5E2E1', marginBottom: 5 }}
        >
          {item.title}
        </p>

        {/* Meta */}
        <div className="space-y-0.5">
          {dateTimeStr    && <MetaRow icon={<CalendarIcon />}>{dateTimeStr}</MetaRow>}
          {hostName       && <MetaRow icon={<PersonIcon   />}>{hostName}</MetaRow>}
          {locationDisplay && <MetaRow icon={<PinIcon      />}>{locationDisplay}</MetaRow>}
          {showPrivateNotice && (
            <MetaRow icon={<LockIcon />}>
              <span className="italic">Location shared with approved attendees</span>
            </MetaRow>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EventInviteCard ────────────────────────────────────────────────────────────

/**
 * Renders a rich event invite card from a type+id pair.
 *
 * Fetches event data internally (module-level cache — never double-fetches).
 * In interactive mode, clicking opens EventDetailModal.
 *
 * Props:
 *   type        'jam' | 'show'
 *   id          string (numeric event id)
 *   compact     boolean — true for chat (52px image), false for feed (80px image)
 *   previewOnly boolean — non-interactive, no CTA strip; used in composers
 */
export function EventInviteCard({ type, id, compact = false, previewOnly = false }) {
  const { user } = useAuth();
  const { status, data: item } = useEventPreview(type, id);
  const [modalOpen, setModalOpen] = useState(false);

  if (status === 'idle' || status === 'loading') return <InviteSkeleton compact={compact} />;
  if (status === 'error' || !item)              return <UnavailableCard compact={compact} />;

  const accent  = getDiscoveryAccentColor(item);
  const variant = getDiscoveryVariant(item.type);
  const isShow  = item.type === 'promote_show';
  const pad     = compact ? '10px 12px' : '14px';

  const cardBaseStyle = {
    background:   hexToRgba(accent, 0.05),
    border:       `1px solid ${hexToRgba(accent, 0.18)}`,
    borderRadius: 16,
    padding:      pad,
  };

  const bodyProps = { item, compact, accent, variant };

  // ── Preview-only (non-interactive, no CTA) — used in PostComposer + composer modals
  if (previewOnly) {
    return (
      <div style={cardBaseStyle}>
        <CardBody {...bodyProps} />
      </div>
    );
  }

  // ── Interactive
  const viewerContext = (user?.id && item.admin_id != null)
    ? { isCreator: String(item.admin_id) === String(user.id) }
    : {};

  // CTA strip — only in feed (non-compact) mode
  const ctaLabel = isShow ? 'View Show' : 'View Jam';
  const showCta  = !compact;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full text-left transition-all duration-150 active:scale-[0.99]"
        style={cardBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background  = hexToRgba(accent, 0.09);
          e.currentTarget.style.borderColor = hexToRgba(accent, 0.3);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background  = hexToRgba(accent, 0.05);
          e.currentTarget.style.borderColor = hexToRgba(accent, 0.18);
        }}
      >
        <CardBody {...bodyProps} />

        {/* CTA strip — full-width row beneath content, feed only */}
        {showCta && (
          <div
            className="flex items-center justify-between mt-3 pt-2.5"
            style={{ borderTop: `1px solid ${hexToRgba(accent, 0.12)}` }}
          >
            <span
              className="text-[11px] font-semibold"
              style={{ color: hexToRgba(accent, 0.7) }}
            >
              {ctaLabel}
            </span>
            <span style={{ color: hexToRgba(accent, 0.55) }}>
              <ChevronRightIcon />
            </span>
          </div>
        )}
      </button>

      {modalOpen && (
        <EventDetailModal
          item={item}
          open={true}
          onClose={() => setModalOpen(false)}
          viewerContext={viewerContext}
        />
      )}
    </>
  );
}
