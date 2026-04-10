import { extractEventLink, stripEventLink } from '../../utils/eventLinkParser'
import { EventInviteCard } from '../event-invite/EventInviteCard'
import { PostJamRef } from './PostJamRef'
import { PostShowRef } from './PostShowRef'

export function PostTextBody({ content, jamRef, showRef }) {
  // Detect event link in post content so we can render an invite card in place of the raw URL.
  const eventLink   = extractEventLink(content)
  // Strip the URL from the displayed text so it doesn't appear twice.
  const displayText = eventLink ? stripEventLink(content) : content

  return (
    <div className="mt-3">
      {/* Caption text — shown only if there is content beyond the event URL */}
      {displayText && (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(229,226,225,0.85)' }}>
          {displayText}
        </p>
      )}

      {/* Event invite card — replaces jamRef/showRef when a URL is detected */}
      {eventLink ? (
        <div className={displayText ? 'mt-2' : undefined}>
          <EventInviteCard
            type={eventLink.type}
            id={eventLink.id}
            compact={false}
          />
        </div>
      ) : (
        <>
          {jamRef  && <PostJamRef  jamRef={jamRef}  />}
          {showRef && <PostShowRef showRef={showRef} />}
        </>
      )}
    </div>
  )
}
