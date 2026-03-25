const PresenceDot = ({ status }) => {
  if (status === 'offline' || !status) return null

  const color = status === 'online' ? '#22C55E' : '#F7C10D'

  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{ width: 10, height: 10, backgroundColor: color }}
    />
  )
}

export default PresenceDot
