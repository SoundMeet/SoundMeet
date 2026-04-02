import { PostJamRef } from './PostJamRef'
import { PostShowRef } from './PostShowRef'

export function PostTextBody({ content, jamRef, showRef }) {
  return (
    <div className="mt-3">
      {content && (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(229,226,225,0.85)' }}>
          {content}
        </p>
      )}
      {jamRef  && <PostJamRef  jamRef={jamRef}   />}
      {showRef && <PostShowRef showRef={showRef} />}
    </div>
  )
}
