import { Music2 } from 'lucide-react'

const ChatHeader = ({ thread, users, onJamLinkClick }) => {
  const isJam = thread?.type === 'jam'

  let threadName = ''
  let subInfo = ''

  if (isJam) {
    threadName = thread.name
    subInfo = `${thread.memberCount} members · ${thread.onlineCount} online`
  } else if (thread?.type === 'dm') {
    const participant = (users || []).find(u => u.id === thread.participantId)
    threadName = participant?.name || ''
    const s = participant?.status
    subInfo = s === 'online' ? 'Online' : s === 'away' ? 'Away' : 'Offline'
  }

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-6 pt-4 pb-5 flex-shrink-0 bg-[#141414]/60 rounded-2xl mx-4 mt-4"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div>
        <div className="font-bold text-[#E5E2E1]" style={{ fontSize: '1.25rem' }}>
          {isJam
            ? <><span style={{ color: '#DC2E73' }}>#</span> {threadName}</>
            : threadName
          }
        </div>
        <div
          className="mt-0.5"
          style={{
            fontSize: '0.75rem',
            color: 'rgba(229,226,225,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {subInfo}
        </div>
      </div>

      {isJam && (
        <button
          onClick={onJamLinkClick}
          className="flex items-center gap-2 text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #DC2E73, #FB4040)',
            borderRadius: '3rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            flexShrink: 0,
          }}
        >
          <Music2 size={16} />
          <span className="hidden sm:inline">View Jam</span>
        </button>
      )}
    </div>
  )
}

export default ChatHeader
