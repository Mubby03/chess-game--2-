const CACHE_NAME = "chess-game-v1.0.0"
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Handle background sync for game state
self.addEventListener("sync", (event) => {
  if (event.tag === "save-game-state") {
    event.waitUntil(saveGameState())
  }
})

// Handle push notifications (for future multiplayer features)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New chess game invitation!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "accept",
        title: "Accept Game",
        icon: "/icons/accept-icon.png",
      },
      {
        action: "decline",
        title: "Decline",
        icon: "/icons/decline-icon.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Chess Game", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "accept") {
    // Handle game acceptance
    event.waitUntil(clients.openWindow("/?action=accept-game"))
  } else if (event.action === "decline") {
    // Handle game decline
    console.log("Game declined")
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Save game state function
async function saveGameState() {
  try {
    // This would save the current game state to IndexedDB
    console.log("Saving game state...")
    // Implementation would go here
  } catch (error) {
    console.error("Failed to save game state:", error)
  }
}
