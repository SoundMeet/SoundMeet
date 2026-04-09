// SoundMeet Service Worker
// Handles background push notifications and notification click routing.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

// Receive a push event from the server (VAPID-based, future backend support)
self.addEventListener('push', (e) => {
  const data = e.data?.json?.() ?? {}
  const title = data.title || 'SoundMeet'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'soundmeet-notif',
    renotify: true,
    data: { url: data.url || '/' },
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// Click a push notification → focus existing tab or open new one
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const hit = clients.find((c) => c.url.includes(self.location.origin) && 'focus' in c)
        if (hit) {
          hit.postMessage({ type: 'NOTIF_NAVIGATE', url })
          return hit.focus()
        }
        return self.clients.openWindow(url)
      })
  )
})
