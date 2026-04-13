import { useState } from 'react'
import { Check, Copy, MessageCircle, X } from 'lucide-react'
import ConversationPicker from './ConversationPicker'
import { useAuth } from '../../injectables/Auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildJamUrl(jamId) {
  return `${window.location.origin}/jam/${jamId}`
}

// ── Success glow icon ─────────────────────────────────────────────────────────

const SuccessGlow = () => (
  <div className="relative flex items-center justify-center mb-5">
    {/* Outer glow ring */}
    <div
      className="absolute rounded-full"
      style={{
        width: 72,
        height: 72,
        background: 'radial-gradient(circle, rgba(220,46,115,0.22) 0%, transparent 70%)',
      }}
    />
    {/* Icon container */}
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 52,
        height: 52,
        background: 'linear-gradient(135deg, rgba(220,46,115,0.18), rgba(251,64,64,0.12))',
        border: '1px solid rgba(220,46,115,0.28)',
      }}
    >
      <Check size={22} strokeWidth={2.5} color="#DC2E73" />
    </div>
  </div>
)

// ── Action button ─────────────────────────────────────────────────────────────

const ActionButton = ({ icon, label, sublabel, onClick, variant = 'default', disabled = false }) => {
  const isPrimary = variant === 'primary'
  const isGhost   = variant === 'ghost'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-2xl transition-all duration-150 active:scale-[0.98]"
      style={{
        padding: '13px 16px',
        background: isPrimary
          ? 'linear-gradient(135deg, rgba(220,46,115,0.18), rgba(251,64,64,0.1))'
          : isGhost
            ? 'transparent'
            : 'rgba(255,255,255,0.05)',
        border: isPrimary
          ? '1px solid rgba(220,46,115,0.3)'
          : isGhost
            ? '1px solid transparent'
            : '1px solid rgba(255,255,255,0.08)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = isPrimary
          ? 'linear-gradient(135deg, rgba(220,46,115,0.26), rgba(251,64,64,0.16))'
          : isGhost
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isPrimary
          ? 'linear-gradient(135deg, rgba(220,46,115,0.18), rgba(251,64,64,0.1))'
          : isGhost
            ? 'transparent'
            : 'rgba(255,255,255,0.05)'
      }}
    >
      {icon !== null && (
        <span
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: isPrimary ? 'rgba(220,46,115,0.15)' : 'rgba(255,255,255,0.06)',
            color: isPrimary ? '#DC2E73' : 'rgba(229,226,225,0.6)',
          }}
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col items-start min-w-0">
        <span
          className="text-sm font-semibold leading-tight"
          style={{ color: isPrimary ? '#E5E2E1' : isGhost ? 'rgba(229,226,225,0.45)' : 'rgba(229,226,225,0.85)' }}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(229,226,225,0.38)' }}>
            {sublabel}
          </span>
        )}
      </div>
    </button>
  )
}

// ── JamCreatedSheet ────────────────────────────────────────────────────────────

/**
 * Renders inside CreateJamModal after successful jam creation.
 *
 * Props:
 *   jamId      string
 *   jamTitle   string
 *   isPrivate  boolean
 *   onClose    () => void
 */
const JamCreatedSheet = ({ jamId, jamTitle, isPrivate, onClose }) => {
  const { user } = useAuth()
  const [view,    setView]    = useState('main')  // 'main' | 'picker'
  const [copied,  setCopied]  = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildJamUrl(jamId))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied — silently ignore
    }
  }

  // ── Picker view ──────────────────────────────────────────────────────────────

  if (view === 'picker') {
    return (
      <ConversationPicker
        jamId={jamId}
        userId={user?.id ? String(user.id) : null}
        onBack={() => setView('main')}
        onClose={onClose}
      />
    )
  }

  // ── Main success view ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col px-6 pt-6 pb-7" style={{ minHeight: 340 }}>
      {/* Close button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.45)' }}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Success state */}
      <div className="flex flex-col items-center text-center mb-7">
        <SuccessGlow />
        <h2
          className="text-xl font-bold tracking-tight mb-1"
          style={{ color: '#E5E2E1', fontFamily: 'Sora, sans-serif' }}
        >
          Jam Created!
        </h2>
        {jamTitle && (
          <p className="text-sm font-medium truncate max-w-[260px]" style={{ color: 'rgba(229,226,225,0.5)' }}>
            {jamTitle}
          </p>
        )}
        {isPrivate && (
          <p className="text-xs mt-2 px-3 py-1 rounded-full" style={{ color: 'rgba(220,46,115,0.9)', background: 'rgba(220,46,115,0.1)', border: '1px solid rgba(220,46,115,0.2)' }}>
            Private jam — invite someone to get them in
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <ActionButton
          icon={<MessageCircle size={17} strokeWidth={2} />}
          label="Invite a Friend"
          sublabel="Send this jam to someone"
          variant="primary"
          onClick={() => setView('picker')}
        />
        <ActionButton
          icon={copied ? <Check size={17} strokeWidth={2.5} /> : <Copy size={17} strokeWidth={2} />}
          label={copied ? 'Link Copied!' : 'Copy Link'}
          sublabel={buildJamUrl(jamId)}
          onClick={handleCopyLink}
        />
        <ActionButton
          icon={null}
          label="Done"
          variant="ghost"
          onClick={onClose}
        />
      </div>
    </div>
  )
}

export default JamCreatedSheet
