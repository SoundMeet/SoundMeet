/**
 * pushNotifications.js
 *
 * Utilities for browser push notification permission and display.
 * Works for "tab not focused" cases via the SW, and "tab visible" cases are
 * intentionally skipped (the in-app panel already covers that).
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch (err) {
    console.warn('[Push] SW registration failed:', err)
    return null
  }
}

export function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestPushPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

/**
 * Show a browser notification only when the page is not visible.
 * Uses the service worker if available (better mobile support), falls back
 * to the Notification constructor otherwise.
 */
export function showBrowserNotification(title, body, url = '/') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return

  const options = {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'soundmeet-notif',
    renotify: true,
    data: { url },
  }

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => {})
  } else {
    try {
      new Notification(title, options)
    } catch {}
  }
}
