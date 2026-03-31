import { X } from 'lucide-react'
import Tag from '../Tag'

// STUB: This modal uses mock jam data. Connect real jam API here.

const JamInfoModal = ({ jam, isOpen, onClose, users }) => {
  if (!isOpen || !jam) return null

  const allUsers = users || []
  const members = (jam.memberIds || [])
    .slice(0, 5)
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full shadow-2xl"
        style={{
          backgroundColor: '#1C1B1B',
          borderRadius: '1.5rem',
          maxWidth: 448,
          padding: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2A2A2A' }}
          aria-label="Close"
        >
          <X size={16} color="#E5E2E1" />
        </button>

        {/* Jam name */}
        <h2
          className="font-bold text-[#E5E2E1] mb-3 pr-8"
          style={{ fontSize: '1.5rem' }}
        >
          {jam.name}
        </h2>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(jam.genre || []).map(g => <Tag key={g} tag={g} />)}
        </div>

        {/* BPM + Key badges */}
        <div className="flex gap-2 mb-3">
          {[`${jam.bpm} BPM`, jam.key].map(label => (
            <div
              key={label}
              style={{
                backgroundColor: '#2A2A2A',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 12px',
                borderRadius: 9999,
                color: '#E5E2E1',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Description */}
        <p
          className="mb-5"
          style={{ fontSize: '0.875rem', color: 'rgba(229,226,225,0.7)' }}
        >
          {jam.description}
        </p>

        {/* Members */}
        <div className="mb-5">
          <div
            className="mb-2"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(229,226,225,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Members
          </div>
          <div className="flex items-center">
            {members.map((member, i) => (
              <img
                key={member.id}
                src={member.avatar}
                alt={member.name}
                title={member.name}
                className="rounded-full object-cover"
                style={{
                  width: 36,
                  height: 36,
                  marginLeft: i === 0 ? 0 : -8,
                  boxShadow: '0 0 0 2px #1C1B1B',
                }}
              />
            ))}
          </div>
        </div>

        {/* Join Jam button */}
        <button
          onClick={() => { console.log('Join Jam stub'); onClose() }}
          className="w-full text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity py-3"
          style={{
            background: 'linear-gradient(135deg, #DC2E73, #FB4040)',
            borderRadius: '3rem',
            fontSize: '0.875rem',
          }}
        >
          Join Jam
        </button>
      </div>
    </div>
  )
}

export default JamInfoModal
