import React from 'react'
import { Link } from 'react-router-dom'

const STRING_DEFS = [
  { x: 113, width: 3.2, color: '#ffe566' }, // Low E
  { x: 117, width: 2.6, color: '#ffd94d' }, // A
  { x: 121, width: 2.1, color: '#ffd040' }, // D
  { x: 125, width: 1.7, color: '#ffffff' }, // G
  { x: 129, width: 1.4, color: '#ffffff' }, // B
  { x: 133, width: 1.1, color: '#ffffff' }, // high e
]

const GuitarSVG = () => (
  <svg
    viewBox="0 0 250 730"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 45px rgba(251,64,64,0.22))' }}
  >
    <defs>
      <filter id="strGlow">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#ff5252" />
        <stop offset="100%" stopColor="#b01818" />
      </linearGradient>
      <linearGradient id="neckGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2a1a08" />
        <stop offset="50%" stopColor="#4a3218" />
        <stop offset="100%" stopColor="#2a1a08" />
      </linearGradient>
      <radialGradient id="bodySheen" cx="32%" cy="28%" r="55%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>

    {/* ── HEADSTOCK ── */}
    <path
      d="M 106 10 C 90 10, 82 23, 84 50 C 86 68, 96 80, 108 84 L 108 93 L 142 93 L 142 84 C 154 80, 164 68, 166 50 C 168 23, 160 10, 144 10 Z"
      fill="#2a1a08"
      stroke="#4a3218"
      strokeWidth="1"
    />
    {/* SoundMeet logo area on headstock */}
    <text x="125" y="58" textAnchor="middle" fill="rgba(247,193,13,0.55)" fontSize="7" fontFamily="Sora, sans-serif" fontWeight="700" letterSpacing="1">
      SOUNDMEET
    </text>

    {/* Tuning pegs – left */}
    {[22, 42, 62].map((y, i) => (
      <g key={i}>
        <line x1="84" y1={y} x2="77" y2={y} stroke="#3a2a10" strokeWidth="2.5" />
        <circle cx="73" cy={y} r="5.5" fill="#f7c10d" stroke="#c8960a" strokeWidth="0.8" />
        <circle cx="73" cy={y} r="2.5" fill="#8a6800" />
      </g>
    ))}
    {/* Tuning pegs – right */}
    {[22, 42, 62].map((y, i) => (
      <g key={i}>
        <line x1="166" y1={y} x2="173" y2={y} stroke="#3a2a10" strokeWidth="2.5" />
        <circle cx="177" cy={y} r="5.5" fill="#f7c10d" stroke="#c8960a" strokeWidth="0.8" />
        <circle cx="177" cy={y} r="2.5" fill="#8a6800" />
      </g>
    ))}

    {/* Nut */}
    <rect x="108" y="92" width="34" height="3" rx="0.5" fill="#e8dfc0" />

    {/* ── NECK ── */}
    <rect x="108" y="92" width="34" height="256" fill="url(#neckGrad)" stroke="#3a2a10" strokeWidth="0.5" />

    {/* Frets */}
    {[0, 18, 35, 51, 66, 80, 93, 105, 117, 128, 138, 148, 157, 166, 175].map((offset, i) => (
      <rect key={i} x="108" y={95 + offset} width="34" height="1.5" rx="0.5" fill="#a87e48" opacity="0.65" />
    ))}

    {/* Fret position dots */}
    <circle cx="125" cy="138" r="3" fill="#f7c10d" opacity="0.7" />
    <circle cx="125" cy="174" r="3" fill="#f7c10d" opacity="0.7" />
    <circle cx="125" cy="208" r="3" fill="#f7c10d" opacity="0.7" />
    <circle cx="119" cy="243" r="2.5" fill="#f7c10d" opacity="0.7" />
    <circle cx="131" cy="243" r="2.5" fill="#f7c10d" opacity="0.7" />

    {/* ── BODY ── */}
    <path
      d="M 125 348
         C 178 348, 218 372, 218 416
         C 218 452, 202 474, 200 500
         C 234 521, 236 566, 228 604
         C 219 645, 185 685, 125 687
         C 65 685, 31 645, 22 604
         C 14 566, 16 521, 50 500
         C 48 474, 32 452, 32 416
         C 32 372, 72 348, 125 348 Z"
      fill="url(#bodyGrad)"
      stroke="#ff4a4a"
      strokeWidth="1.5"
    />
    {/* Sheen overlay */}
    <path
      d="M 125 348
         C 178 348, 218 372, 218 416
         C 218 452, 202 474, 200 500
         C 234 521, 236 566, 228 604
         C 219 645, 185 685, 125 687
         C 65 685, 31 645, 22 604
         C 14 566, 16 521, 50 500
         C 48 474, 32 452, 32 416
         C 32 372, 72 348, 125 348 Z"
      fill="url(#bodySheen)"
    />

    {/* Sound hole */}
    <circle cx="125" cy="492" r="36" fill="#180808" stroke="#ff4444" strokeWidth="1.5" />
    <circle cx="125" cy="492" r="30" fill="none" stroke="#ff5555" strokeWidth="0.5" opacity="0.4" />
    <circle cx="125" cy="492" r="23" fill="none" stroke="#ff5555" strokeWidth="0.5" opacity="0.25" />
    <circle cx="125" cy="492" r="15" fill="none" stroke="#ff5555" strokeWidth="0.5" opacity="0.15" />

    {/* Neck block (neck-to-body joint fill) */}
    <rect x="108" y="348" width="34" height="22" fill="url(#neckGrad)" />

    {/* Bridge */}
    <rect x="109" y="582" width="32" height="10" rx="2" fill="#2a1a08" stroke="#f7c10d" strokeWidth="0.8" />
    {/* Saddle */}
    <rect x="111" y="584" width="28" height="4" rx="1" fill="#e0d8b0" />

    {/* ── STRINGS (SMIL vibration) ── */}
    {STRING_DEFS.map((s, i) => (
      <line
        key={i}
        x1={s.x} y1="93"
        x2={s.x} y2="588"
        stroke={s.color}
        strokeWidth={s.width}
        opacity="0.92"
      />
    ))}
  </svg>
)

const NotFound = () => {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center"
    >

      {/* Guitar-side ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 75% at 78% 52%, rgba(251,64,64,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 flex items-center w-full px-10 lg:px-50 min-h-screen">

        {/* ── LEFT: Text ── */}
        <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">

          {/* 404 */}
          <h1
            className="font-black leading-none mb-3 select-none"
            style={{
              fontSize: 'clamp(5.5rem, 13vw, 9.5rem)',
              fontFamily: 'Sora, sans-serif',
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            SORRY
          </h1>

          {/* Subtitle */}
          <h2
            className="font-bold mb-5"
            style={{
              fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
              fontFamily: 'Sora, sans-serif',
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            404s and Heartbreaks
          </h2>

          {/* Body copy */}
          <p
            className="mb-10 leading-relaxed"
            style={{
              color: 'rgba(255,255,255,0.32)',
              fontSize: '0.92rem',
              maxWidth: '22rem',
            }}
          >
            The page you're looking for was doesn't exist :(
          </p>

          {/* CTA */}
          <Link
            to="/"
            className="not-found-btn inline-flex items-center gap-3 font-bold"
            style={{
              padding: '13px 30px',
              backgroundColor: '#fb4040',
              color: '#ffffff',
              borderRadius: '9999px',
              fontFamily: 'Sora, sans-serif',
              fontSize: '0.88rem',
              letterSpacing: '0.025em',
              textDecoration: 'none',
              boxShadow: '0 0 28px rgba(251,64,64,0.28)',
              transition: 'background-color 0.18s, box-shadow 0.18s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* ── RIGHT: Guitar ── */}
        <div className="hidden lg:block flex-1 relative" style={{ height: '100vh' }}>
          <div
            style={{
              position: 'absolute',
              right: '200px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: '300px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <GuitarSVG />
          </div>
        </div>
      </div>

      <style>{`
        .not-found-btn:hover {
          background-color: #ff5555 !important;
          box-shadow: 0 0 40px rgba(251,64,64,0.45) !important;
        }
      `}</style>
    </div>
  )
}

export default NotFound