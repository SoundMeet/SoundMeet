/**
 * Vercel Edge Middleware — dynamic OG tags for social crawlers.
 *
 * When WhatsApp, Facebook, Twitter, Slack, Discord, Telegram, or LinkedIn
 * crawl a /jam/:id, /show/:id, or /profile/:username URL, this middleware
 * fetches the event/profile data from Supabase and returns a minimal HTML
 * page with the correct og:title, og:description, og:image, and og:url tags.
 *
 * Real users (non-crawler User-Agents) pass straight through to the SPA.
 */

const SUPABASE_URL = 'https://hbdoqesapzedjwdgtnyq.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/media`
const SITE_URL = 'https://www.soundmeet.app'
const DEFAULT_IMAGE = `${SITE_URL}/og-banner.png`

// ─── Crawler detection ───────────────────────────────────────────────────────

const CRAWLER_PATTERNS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'slackbot',
  'linkedinbot',
  'discordbot',
  'telegrambot',
  'googlebot',
  'bingbot',
  'pinterestbot',
  'applebot',
  'embedly',
  'quora link preview',
  'outbrain',
  'rogerbot',
  'showyoubot',
  'vkshare',
  'w3c_validator',
  'redditbot',
]

function isCrawler(ua) {
  if (!ua) return false
  const lower = ua.toLowerCase()
  return CRAWLER_PATTERNS.some((p) => lower.includes(p))
}

// ─── Supabase REST helper ────────────────────────────────────────────────────

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) ? data[0] ?? null : data
}

// ─── Media URL resolver ──────────────────────────────────────────────────────

function resolveMedia(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${STORAGE_BASE}/${encodeURIComponent(clean)}`
}

// ─── Data fetchers ───────────────────────────────────────────────────────────

async function fetchJam(id) {
  const row = await supabaseGet(
    `chat_jam?id=eq.${id}&select=id,name,description,cover_image,location_name,date_time,genres:chat_jam_genre(genre:genre_id(name))`
  )
  if (!row) return null
  const genres = (row.genres ?? []).map((g) => g.genre?.name).filter(Boolean)
  return {
    title: row.name || 'Jam Session',
    description:
      row.description ||
      `Jam session${row.location_name ? ` at ${row.location_name}` : ''}${genres.length ? ` — ${genres.join(', ')}` : ''}. Join on Soundmeet.`,
    image: resolveMedia(row.cover_image) || DEFAULT_IMAGE,
    url: `${SITE_URL}/jam/${id}`,
  }
}

async function fetchShow(id) {
  const row = await supabaseGet(
    `chat_show?id=eq.${id}&select=id,name,description,cover_image,venue_name,location_name,date_time,genres:chat_show_genres(genre:chat_genre(name))`
  )
  if (!row) return null
  const genres = (row.genres ?? []).map((g) => g.genre?.name).filter(Boolean)
  return {
    title: row.name || 'Live Show',
    description:
      row.description ||
      `Live show${row.venue_name || row.location_name ? ` at ${row.venue_name || row.location_name}` : ''}${genres.length ? ` — ${genres.join(', ')}` : ''}. Check it out on Soundmeet.`,
    image: resolveMedia(row.cover_image) || DEFAULT_IMAGE,
    url: `${SITE_URL}/show/${id}`,
  }
}

async function fetchProfile(username) {
  const row = await supabaseGet(
    `chat_profile?id=eq.${username}&select=id,username,display_name,about,pfp,instruments_liked:chat_profile_instruments_liked(instrument:chat_instrument(name))`
  )
  if (!row) return null
  const name = row.display_name || row.username || 'Musician'
  const instruments = (row.instruments_liked ?? [])
    .map((i) => i.instrument?.name)
    .filter(Boolean)
  return {
    title: `${name} on Soundmeet`,
    description:
      row.about ||
      `${name}${instruments.length ? ` plays ${instruments.slice(0, 3).join(', ')}` : ''} on Soundmeet.`,
    image: resolveMedia(row.pfp) || DEFAULT_IMAGE,
    url: `${SITE_URL}/profile/${username}`,
  }
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildOgHtml({ title, description, image, url }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description.slice(0, 200))
  const i = escapeHtml(image)
  const u = escapeHtml(url)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${t} | Soundmeet</title>
  <meta name="description" content="${d}" />

  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${i}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Soundmeet" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${i}" />

  <meta http-equiv="refresh" content="0;url=${u}" />
</head>
<body></body>
</html>`
}

// ─── Route matching ──────────────────────────────────────────────────────────

function matchRoute(pathname) {
  let m
  m = pathname.match(/^\/jam\/(\d+)\/?$/)
  if (m) return { type: 'jam', id: m[1] }

  m = pathname.match(/^\/show\/(\d+)\/?$/)
  if (m) return { type: 'show', id: m[1] }

  m = pathname.match(/^\/profile\/([^/]+)\/?$/)
  if (m) return { type: 'profile', id: m[1] }

  return null
}

// ─── Middleware entry point ──────────────────────────────────────────────────

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''

  // Only intercept crawlers
  if (!isCrawler(ua)) return

  const { pathname } = new URL(request.url)
  const route = matchRoute(pathname)
  if (!route) return

  let meta = null
  try {
    if (route.type === 'jam') meta = await fetchJam(route.id)
    else if (route.type === 'show') meta = await fetchShow(route.id)
    else if (route.type === 'profile') meta = await fetchProfile(route.id)
  } catch {
    // If fetch fails, fall through to SPA
    return
  }

  if (!meta) return

  return new Response(buildOgHtml(meta), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: ['/jam/:path*', '/show/:path*', '/profile/:path*'],
}
