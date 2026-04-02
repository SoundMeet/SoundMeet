import { MdLocationOn } from 'react-icons/md'

export function PostLocationTag({ location }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(229,226,225,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <MdLocationOn className="text-xs" style={{ color: '#DC2E73' }} />
      {location.name}
    </span>
  )
}
