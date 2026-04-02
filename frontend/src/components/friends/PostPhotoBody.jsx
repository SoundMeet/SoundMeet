import { useState } from 'react'
import { PostJamRef } from './PostJamRef'

export function PostPhotoBody({ content, media, jamRef }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const images = media?.images ?? []

  return (
    <div className="mt-3">
      {content && (
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(229,226,225,0.85)' }}>
          {content}
        </p>
      )}

      {images.length > 0 && (
        <div className="relative">
          {/* Main image */}
          <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
            <img
              src={images[activeIndex]}
              alt=""
              className="w-full h-full object-cover"
              style={{ background: '#1a1a1a' }}
            />
          </div>

          {/* Dot indicators (multi-image) */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === activeIndex ? 16 : 6,
                    height: 6,
                    background: i === activeIndex ? '#DC2E73' : 'rgba(255,255,255,0.2)',
                  }}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {jamRef && <PostJamRef jamRef={jamRef} />}
    </div>
  )
}
