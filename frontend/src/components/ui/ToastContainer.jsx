import { useEffect, useState } from 'react'

function Toast({ toast, onDismiss }) {
  const { id, message, type } = toast
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const styles = {
    success: {
      border: '1px solid rgba(220,46,115,0.3)',
      iconColor: '#DC2E73',
      icon: '✓',
    },
    error: {
      border: '1px solid rgba(239,68,68,0.35)',
      iconColor: '#ef4444',
      icon: '✕',
    },
    info: {
      border: '1px solid rgba(255,255,255,0.12)',
      iconColor: 'rgba(229,226,225,0.5)',
      icon: 'ℹ',
    },
  }

  const s = styles[type] ?? styles.success

  return (
    <div
      style={{
        background: 'rgba(18,18,18,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: s.border,
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        minWidth: '220px',
        maxWidth: '340px',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          color: s.iconColor,
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
          width: '16px',
          textAlign: 'center',
        }}
      >
        {s.icon}
      </span>
      <span
        style={{
          color: 'rgba(229,226,225,0.9)',
          fontSize: '13px',
          flex: 1,
          lineHeight: '1.4',
        }}
      >
        {message}
      </span>
      <button
        onClick={() => onDismiss(id)}
        style={{
          color: 'rgba(229,226,225,0.25)',
          fontSize: '18px',
          lineHeight: 1,
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(229,226,225,0.6)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(229,226,225,0.25)')}
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
