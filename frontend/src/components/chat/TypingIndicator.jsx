const TypingIndicator = ({ isTyping, user }) => {
  if (!isTyping) return null

  return (
    <div className="flex items-center gap-2 px-6 py-2 flex-shrink-0">
      <img
        src={user?.avatar}
        alt={user?.name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: 28, height: 28 }}
      />
      <span
        className="italic"
        style={{ fontSize: '0.75rem', color: 'rgba(229,226,225,0.7)' }}
      >
        {user?.name} is typing
      </span>
      <div className="flex items-center gap-1">
        {[0, 100, 200].map((delay, i) => (
          <div
            key={i}
            className="animate-bounce rounded-full"
            style={{
              width: 5,
              height: 5,
              backgroundColor: '#393939',
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default TypingIndicator
