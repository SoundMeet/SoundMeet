import { MdMusicNote } from 'react-icons/md'

export function PostJamRef({ jamRef }) {
  const { title, date, locationName } = jamRef

  const formatted = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:bg-[rgba(220,46,115,0.11)] hover:border-[rgba(220,46,115,0.35)] active:scale-[0.99]"
      style={{
        background: 'rgba(220,46,115,0.06)',
        border: '1px solid rgba(220,46,115,0.2)',
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(220,46,115,0.15)' }}
      >
        <MdMusicNote className="text-sm" style={{ color: '#DC2E73' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{title}</p>
        <p className="text-[10px] truncate" style={{ color: 'rgba(229,226,225,0.45)' }}>
          {formatted}{locationName ? ` · ${locationName}` : ''}
        </p>
      </div>
    </div>
  )
}
