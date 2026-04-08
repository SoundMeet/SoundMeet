const SUPABASE_URL = 'https://hbdoqesapzedjwdgtnyq.supabase.co'
const BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/media/`

export function formatAvatarUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BUCKET_URL}${cleanPath}`
}
