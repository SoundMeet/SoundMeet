const PresenceDot = ({ status }) => {
  if (status === 'offline' || !status) return null

  const isOnline = status === 'online'
  const color = isOnline ? '#22C55E' : '#F7C10D'
  const glow = isOnline
    ? '0 0 0 2px rgba(20,20,20,0.9), 0 0 5px rgba(34,197,94,0.4)'
    : '0 0 0 2px rgba(20,20,20,0.9)'

  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: 8,
        height: 8,
        backgroundColor: color,
        boxShadow: glow,
      }}
    />
  )
}

export default PresenceDot
