const CACHE_NAME = 'osmotrack-v3'
const STATIC_ASSETS = [
  '/osmotrack/manifest.json',
  '/osmotrack/icons/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore errors for missing files during development
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = {} }
  const d = payload.data || payload.notification || payload
  event.waitUntil(
    self.registration.showNotification(d.title || 'OsmoTrack', {
      body: d.body || '',
      tag: 'osmotrack-weekly',
      data: { route: d.route || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = self.registration.scope + '#' + (event.notification.data?.route || '/dashboard')
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.registration.scope))
      if (open) return open.focus().then((c) => c.navigate(url))
      return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Navigation requests (HTML pages): network-first so index.html is always fresh
  // This ensures new deployments are picked up immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/osmotrack/index.html'))
    )
    return
  }

  // Static assets (JS, CSS, images): cache-first for performance
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.url.includes('/osmotrack/')) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      }).catch(() => null)
    })
  )
})
