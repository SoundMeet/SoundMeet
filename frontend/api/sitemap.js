/**
 * Dynamic sitemap generator — Vercel Serverless Function.
 *
 * Queries Supabase for all public jams, shows, and profiles,
 * then returns a valid XML sitemap with every URL.
 *
 * Served at /sitemap.xml via a vercel.json rewrite.
 */

const SUPABASE_URL = 'https://hbdoqesapzedjwdgtnyq.supabase.co'
const SITE_URL = 'https://www.soundmeet.app'

async function supabaseQuery(table, select, filter = '') {
  const key = process.env.SUPABASE_ANON_KEY
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter}`
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return []
  return res.json()
}

function toISODate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

function urlEntry(loc, lastmod, priority = '0.6', changefreq = 'weekly') {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export default async function handler(req, res) {
  try {
    // Fetch all data in parallel
    const [jams, shows, profiles] = await Promise.all([
      supabaseQuery('chat_jam', 'id,date_time'),
      supabaseQuery('chat_show', 'id,date_time'),
      supabaseQuery('chat_profile', 'id,updated_at'),
    ])

    const today = new Date().toISOString().split('T')[0]

    // Static pages
    const staticUrls = [
      urlEntry(`${SITE_URL}/`, today, '1.0', 'daily'),
      urlEntry(`${SITE_URL}/about`, today, '0.8', 'monthly'),
    ]

    // Jam pages
    const jamUrls = jams.map((jam) =>
      urlEntry(`${SITE_URL}/jam/${jam.id}`, toISODate(jam.date_time), '0.7')
    )

    // Show pages
    const showUrls = shows.map((show) =>
      urlEntry(`${SITE_URL}/show/${show.id}`, toISODate(show.date_time), '0.7')
    )

    // Profile pages
    const profileUrls = profiles.map((p) =>
      urlEntry(`${SITE_URL}/profile/${p.id}`, toISODate(p.updated_at), '0.5')
    )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...jamUrls, ...showUrls, ...profileUrls].join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.status(200).send(xml)
  } catch (err) {
    // Fallback minimal sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <priority>0.8</priority>
  </url>
</urlset>`
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(xml)
  }
}
