const CACHE_NAME = 'observation-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icon-512.png'
];

// Installer le service worker et mettre en cache les ressources initiales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mise en cache des ressources statiques');
        return cache.addAll(urlsToCache);
      })
  );
  // Forcer l'activation immédiate
  self.skipWaiting();
});

// Activer et nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre le contrôle de tous les clients sans recharger
      return self.clients.claim();
    })
  );
});

// Intercepter les requêtes fetch et répondre avec des ressources en cache lorsque disponibles
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Gérer la synchronisation en arrière-plan (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-observations') {
    console.log('Tentative de synchronisation en arrière-plan');
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'TRIGGER_SYNC'
        });
      });
    });
  }
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Intercepter les événements de notification push
self.addEventListener('push', (event) => {
  const title = 'Observations d\'Animaux';
  const options = {
    body: event.data?.text() || 'Nouvelle notification',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.ico'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Intercepter les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
