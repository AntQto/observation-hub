
const CACHE_NAME = 'observation-app-v4';
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

// Installation du service worker et mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mise en cache des ressources statiques');
        return cache.addAll(urlsToCache);
      })
  );
  // Activation immédiate
  self.skipWaiting();
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Contrôle de tous les clients sans recharger
      return self.clients.claim();
    })
  );
});

// Stratégie de cache: essayer d'abord le cache, puis le réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner le cache si disponible
        if (response) {
          return response;
        }

        // Sinon faire une requête réseau
        return fetch(event.request.clone())
          .then((response) => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Mettre en cache la nouvelle réponse
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback pour les navigations en cas d'échec
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Gestion synchronisation en arrière-plan
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

// Notifier les clients d'une mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Gestion des notifications push
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

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
